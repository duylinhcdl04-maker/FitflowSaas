import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RoleCode } from '../types/role';
import type { RequestUser } from '../types/jwt-payload';

/** Must run after JwtAuthGuard. Allows the request if the user holds at least one of @Roles(...). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RoleCode[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const user: RequestUser = context.switchToHttp().getRequest().user;
    return Boolean(user?.roles?.some((role) => required.includes(role)));
  }
}
