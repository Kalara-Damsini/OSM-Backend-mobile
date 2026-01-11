import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from './enum/order.enums';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    private readonly dataSource: DataSource,
  ) {}

  private toNumber(value: unknown, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  // simple unique order code; can upgrade later to ORD-2026-0001
  private generateOrderCode() {
    const short = Date.now().toString().slice(-6);
    return `ORD-${short}`;
  }

  async create(dto: CreateOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const itemRepo = manager.getRepository(OrderItem);

      if (!dto.items?.length) {
        throw new BadRequestException('Order must have at least 1 item');
      }

      const total = this.toNumber(dto.total);
      const advance = this.toNumber(dto.advance);
      const balance = total - advance;

      const order = orderRepo.create({
        customerName: dto.customerName,
        mobileNo: dto.mobileNo,
        address: dto.address,
        platform: dto.platform,
        orderDate: dto.orderDate,
        deadline: dto.deadline,
        description: dto.description,
        notes: dto.notes,
        status: OrderStatus.PENDING,

        orderCode: this.generateOrderCode(),
        total: total.toString(),
        advance: advance.toString(),
        balance: balance.toString(),
      });

      const saved = await orderRepo.save(order);

      const items = dto.items.map((i) =>
        itemRepo.create({
          name: i.name,
          price: i.price,
          order: saved,
        }),
      );

      await itemRepo.save(items);

      return orderRepo.findOne({
        where: { id: saved.id },
        relations: ['items'],
      });
    });
  }

  findAll() {
    return this.repo.find({
      relations: ['items'],
      order: { deadline: 'ASC' },
    });
  }

  async findOne(id: string) {
    const order = await this.repo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async update(id: string, dto: UpdateOrderDto) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const itemRepo = manager.getRepository(OrderItem);

      const order = await orderRepo.findOne({
        where: { id },
        relations: ['items'],
      });

      if (!order) throw new NotFoundException('Order not found');

      // replace items if provided
      if (dto.items) {
        await itemRepo.delete({ order: { id: order.id } });

        const newItems = dto.items.map((i) =>
          itemRepo.create({
            name: i.name,
            price: i.price,
            order,
          }),
        );

        await itemRepo.save(newItems);
      }

      // recalc money
      const total =
        dto.total !== undefined
          ? this.toNumber(dto.total)
          : this.toNumber(order.total);
      const advance =
        dto.advance !== undefined
          ? this.toNumber(dto.advance)
          : this.toNumber(order.advance);

      order.total = total.toString();
      order.advance = advance.toString();
      order.balance = (total - advance).toString();

      // other fields (type-safe, no any)
      if (dto.customerName !== undefined) order.customerName = dto.customerName;
      if (dto.mobileNo !== undefined) order.mobileNo = dto.mobileNo;
      if (dto.address !== undefined) order.address = dto.address;
      if (dto.platform !== undefined) order.platform = dto.platform;
      if (dto.status !== undefined) order.status = dto.status;
      if (dto.description !== undefined) order.description = dto.description;
      if (dto.notes !== undefined) order.notes = dto.notes;
      if (dto.orderDate !== undefined) order.orderDate = dto.orderDate;
      if (dto.deadline !== undefined) order.deadline = dto.deadline;

      await orderRepo.save(order);

      return orderRepo.findOne({
        where: { id: order.id },
        relations: ['items'],
      });
    });
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    return this.repo.remove(order);
  }

  async addProofImages(id: string, urls: string[], markCompleted = false) {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot upload proof for cancelled orders');
    }

    order.proofImages = [...(order.proofImages || []), ...urls];

    // if you want: proof upload can complete the order
    if (markCompleted) order.status = OrderStatus.COMPLETED;

    return this.repo.save(order);
  }
}
