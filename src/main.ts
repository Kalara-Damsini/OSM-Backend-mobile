import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /* ---------------- UPLOADS FOLDER ---------------- */
  const uploadPath = join(process.cwd(), 'uploads');
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath);
  }

  app.use('/uploads', express.static(uploadPath));

  /* ---------------- GLOBAL VALIDATION ---------------- */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove extra fields
      forbidNonWhitelisted: true, // throw error for unknown fields
      transform: true, // auto-transform DTO types
    }),
  );

  /* ---------------- CORS (React Native needs this) ---------------- */
  app.enableCors({
    origin: '*', // later restrict in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  /* ---------------- OPTIONAL API PREFIX ---------------- */
  // If you enable this, your routes become: /api/orders
  // app.setGlobalPrefix("api");

  await app.listen(3000);
  console.log('Server running on http://localhost:3000');
}
void bootstrap();
