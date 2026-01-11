/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // upload proof images after delivery
  // form-data key must be: files
  @Post(':id/proof')
  @UseInterceptors(FilesInterceptor('files', 5, { dest: 'uploads' }))
  uploadProof(
    @Param('id') id: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const safeFiles = Array.isArray(files) ? files : [];
    const urls = safeFiles.map((f) => `/uploads/${f.filename}`);
    return this.service.addProofImages(id, urls);
  }
}
