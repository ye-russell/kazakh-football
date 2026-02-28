import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Simple API-key guard for admin-only endpoints.
 * Checks the `x-admin-key` header against the ADMIN_API_KEY env var.
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  private readonly adminKey: string | undefined;

  constructor(config: ConfigService) {
    this.adminKey = config.get<string>('ADMIN_API_KEY');
  }

  canActivate(context: ExecutionContext): boolean {
    if (!this.adminKey) {
      throw new UnauthorizedException(
        'ADMIN_API_KEY is not configured on the server',
      );
    }

    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-admin-key'];

    if (!providedKey || providedKey !== this.adminKey) {
      throw new UnauthorizedException('Invalid or missing admin key');
    }

    return true;
  }
}
