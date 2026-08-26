import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestUser } from '../types/jwt-payload';

/** Reads the authenticated user attached by JwtAuthGuard. Usage: @CurrentUser() user: RequestUser */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: RequestUser = request.user;
    return data ? user?.[data] : user;
  },
);
