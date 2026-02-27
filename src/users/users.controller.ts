import {
  Controller,
  Get,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

interface AuthRequest extends Request {
  user?: { sub?: string };
}

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: AuthRequest) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new BadRequestException(
        'Authenticated request did not contain a user identifier',
      );
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    };
  }
}
