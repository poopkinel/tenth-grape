import { io, Socket } from 'socket.io-client';
import { secureStorage } from './secure-storage';

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3002/api').replace('/api', '');

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await secureStorage.get('accessToken');

  socket = io(`${BASE_URL}/chat`, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
  });

  return socket;
}

export async function joinConversation(conversationId: string) {
  const s = await getSocket();
  s.emit('joinConversation', { conversationId });
}

export async function sendMessage(conversationId: string, content: string) {
  const s = await getSocket();
  s.emit('sendMessage', { conversationId, content });
}

export async function markRead(conversationId: string) {
  const s = await getSocket();
  s.emit('markRead', { conversationId });
}

export async function leaveConversation(conversationId: string) {
  const s = await getSocket();
  s.emit('leaveConversation', { conversationId });
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
