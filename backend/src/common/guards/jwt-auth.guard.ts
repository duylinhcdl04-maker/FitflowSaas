import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Validates the access token via the 'jwt' passport strategy and attaches req.user. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
