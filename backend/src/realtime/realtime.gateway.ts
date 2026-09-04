import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../common/types/jwt-payload';

/**
 * Realtime push channel shared by Owner/Manager/Staff frontends. Mirrors the
 * HTTP CORS allow-list in main.ts (any localhost/127.0.0.1 origin + FRONTEND_URL).
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      const isLocalhost =
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        /^https?:\/\/([a-zA-Z0-9-]+\.)*localhost(:[0-9]+)?$/i.test(origin) ||
        /^https?:\/\/([a-zA-Z0-9-]+\.)*127\.0\.0\.1(:[0-9]+)?$/i.test(origin);
      const isFitflowDomain =
        origin === 'https://fitfloww.store' ||
        origin === 'http://fitfloww.store' ||
        origin.endsWith('.fitfloww.store') ||
        origin === 'https://fitflow.io.vn' ||
        origin === 'http://fitflow.io.vn' ||
        origin.endsWith('.fitflow.io.vn') ||
        origin.endsWith('.vercel.app');
      const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean) as string[];
      if (isLocalhost || isFitflowDomain || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Blocked by CORS'));
    },
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ||
      (client.handshake.query?.token as string | undefined);

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      client.data.user = payload;
      if (payload.tenantId) {
        client.join(`tenant:${payload.tenantId}`);
      }
      // Personal room — lets other services push a notification straight to this one
      // user (bell badge) without broadcasting to the whole tenant/branch.
      client.join(`user:${payload.sub}`);
    } catch {
      this.logger.warn(`Socket connection rejected: invalid token (${client.id})`);
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    // No-op — rooms are cleaned up automatically by socket.io on disconnect.
  }

  @SubscribeMessage('join-branch')
  onJoinBranch(client: Socket, branchId: string) {
    const user = client.data.user as JwtPayload | undefined;
    if (!user?.tenantId || !branchId) return;
    client.join(`tenant:${user.tenantId}:branch:${branchId}`);
  }

  /** Push an event to everyone currently viewing the given branch. */
  emitToBranch(tenantId: string, branchId: string, event: string, payload: unknown) {
    this.server?.to(`tenant:${tenantId}:branch:${branchId}`).emit(event, payload);
  }

  /** Push an event to everyone in the tenant, regardless of branch. */
  emitToTenant(tenantId: string, event: string, payload: unknown) {
    this.server?.to(`tenant:${tenantId}`).emit(event, payload);
  }

  /** Push an event to one specific user (any tab/device they have open) — e.g. a new notification. */
  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }
}
