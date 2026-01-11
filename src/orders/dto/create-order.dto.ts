import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderPlatform } from '../enum/order.enums';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  mobileNo: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsEnum(OrderPlatform)
  platform: OrderPlatform;

  // YYYY-MM-DD
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'orderDate must be YYYY-MM-DD' })
  orderDate: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'deadline must be YYYY-MM-DD' })
  deadline: string;

  @IsString()
  total: string;

  @IsString()
  advance: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
