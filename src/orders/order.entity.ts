import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderPlatform } from './enum/order.enums';
import { OrderStatus } from './enum/order.enums';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderCode: string;

  @Column()
  customerName: string;

  @Column()
  mobileNo: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'enum', enum: OrderPlatform })
  platform: OrderPlatform;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  // store as "YYYY-MM-DD"
  @Column({ type: 'date' })
  orderDate: string;

  @Column({ type: 'date' })
  deadline: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  advance: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  balance: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // proof image URLs like ["/uploads/abc.jpg", ...]
  @Column({ type: 'text', array: true, nullable: true })
  proofImages?: string[];

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
