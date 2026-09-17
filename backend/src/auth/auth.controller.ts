import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/jwt-payload';
import { BypassAccessMode } from '../common/decorators/bypass-access-mode.decorator';

const REFRESH_COOKIE = 'fitflow_refresh_token';

// Đăng nhập/làm mới phiên phải luôn hoạt động kể cả khi Tenant đang
// READ_ONLY/BLOCKED — nếu không Owner sẽ không có cách nào đăng nhập lại để
// vào trang Subscription và nâng cấp gói (xem AccessModeGuard).
@BypassAccessMode()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.login(
      dto,
      req.tenant?.id,
    );
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, refreshToken, user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refreshToken?: string },
  ) {
    const token = req.cookies?.[REFRESH_COOKIE] || body?.refreshToken;
    if (!token) throw new UnauthorizedException('Thiếu phiên đăng nhập');

    const { accessToken, refreshToken } = await this.authService.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, refreshToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    const rawDomain = process.env.COOKIE_DOMAIN?.trim();
    const isLocalhost = !rawDomain || rawDomain === 'localhost' || rawDomain.endsWith('localhost');
    const domain = isLocalhost ? undefined : rawDomain;

    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth', domain });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.id);
  }

  private setRefreshCookie(res: Response, token: string) {
    const rawDomain = process.env.COOKIE_DOMAIN?.trim();
    const isLocalhost = !rawDomain || rawDomain === 'localhost' || rawDomain.endsWith('localhost');
    const domain = isLocalhost ? undefined : rawDomain;

    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      domain,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
