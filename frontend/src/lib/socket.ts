import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../owner/store/auth-store';

// Owner/Manager/Staff all share the one tenant-side session (see RequireStaffAuth.tsx),
// so a single socket singleton + auth store is enough for all three areas.

let socket: Socket | null = null;
let joinedBranchId: string | null = null;

function apiBase(): string {
  return import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1';
}

/** Strips the trailing /api/v1 (or similar) prefix to get the bare server origin Socket.IO connects to. */
function socketOrigin(): string {
  return apiBase().replace(/\/api(\/v\d+)?\/?$/, '');
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${socketOrigin()}/realtime`, {
      autoConnect: false,
      transports: ['websocket'],
    });
    // Re-join the last known branch room after any reconnect (new socket.io connection = fresh rooms server-side).
    socket.on('connect', () => {
      if (joinedBranchId) socket?.emit('join-branch', joinedBranchId);
    });
  }

  const token = useAuthStore.getState().accessToken;
  socket.auth = { token };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

/** Joins the realtime room for a branch so this client receives its events. Safe to call repeatedly. */
export function joinBranch(branchId: string | null | undefined) {
  if (!branchId || branchId === joinedBranchId) return;
  joinedBranchId = branchId;
  getSocket().emit('join-branch', branchId);
}

export function disconnectSocket() {
  socket?.disconnect();
  joinedBranchId = null;
}
