import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

// shape of the JWT payload your app uses
interface UserPayload {
  sub: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
}

// extend the express request with a user property
interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    const authHeader = req.headers?.authorization || '';
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      // use verify<T>() to avoid `any` and get a typed payload
      const payload = this.jwt.verify<UserPayload>(token, {
        secret: process.env.JWT_SECRET || 'dev_secret',
      });

      req.user = payload; // { sub, email, role } (whatever you sign)
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
