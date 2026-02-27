import {
  BadRequestException,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

interface AuthRequest extends Request {
  user?: { sub?: string };
}

function avatarFileName(
  _: any,
  file: Express.Multer.File,
  cb: (error: Error | null, filename: string) => void,
) {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = extname(file.originalname || '.jpg') || '.jpg';
  cb(null, `${unique}${ext}`);
}

function imageFileFilter(
  _: any,
  file: Express.Multer.File,
  cb: (error: Error | null, accepted: boolean) => void,
) {
  const ok = /\/(jpg|jpeg|png|webp)$/i.test(file.mimetype);
  if (!ok) {
    cb(new BadRequestException('Only image files allowed'), false);
    return;
  }
  cb(null, true);
}

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: AuthRequest) {
    const userId = req.user?.sub;
    if (!userId) throw new BadRequestException('Missing user id');

    const user = await this.users.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      shopName: user.shopName ?? 'My Shop',
      avatarUrl: user.avatarUrl ?? null,
    };
  }

  // ✅ update shop name
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Req() req: AuthRequest, @Body() body: UpdateMeDto) {
    const userId = req.user?.sub;
    if (!userId) throw new BadRequestException('Missing user id');

    const updated = await this.users.updateMe(userId, {
      shopName: body.shopName?.trim() || null,
    });

    return {
      id: updated?.id,
      fullName: updated?.fullName,
      email: updated?.email,
      shopName: updated?.shopName ?? 'My Shop',
      avatarUrl: updated?.avatarUrl ?? null,
    };
  }

  // ✅ upload avatar image
  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads/avatars',
        filename: avatarFileName,
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
    }),
  )
  async uploadAvatar(
    @Req() req: AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req.user?.sub;
    if (!userId) throw new BadRequestException('Missing user id');
    if (!file) throw new BadRequestException('File is required');

    const avatarUrl = `/uploads/avatars/${file.filename}`;

    const updated = await this.users.updateMe(userId, { avatarUrl });

    return {
      avatarUrl: updated?.avatarUrl,
    };
  }
}
