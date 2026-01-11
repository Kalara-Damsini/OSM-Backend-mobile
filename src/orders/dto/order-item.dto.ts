import { IsOptional, IsString } from 'class-validator';

export class OrderItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  price?: string; // keep as string "5000" / "5000.00"
}
