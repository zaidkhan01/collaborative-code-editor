import { io, Socket } from 'socket.io-client';
import { ExecutionResult, ChatMessage } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Room operations
  joinRoom(roomId: string) {
    this.socket?.emit('join-room', roomId);
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave-room', roomId);
  }

  // Code operations
  sendCodeChange(roomId: string, code: string, changes: object) {
    this.socket?.emit('code-change', { roomId, code, changes });
  }

  // Cursor operations
  sendCursorMove(roomId: string, position: { lineNumber: number; column: number }) {
    this.socket?.emit('cursor-move', { roomId, position });
  }

  // Language operations
  sendLanguageChange(roomId: string, language: string) {
    this.socket?.emit('language-change', { roomId, language });
  }

  // Code execution
  executeCode(roomId: string, code: string, language: string) {
    this.socket?.emit('execute-code', { roomId, code, language });
  }

  // Chat
  sendChatMessage(roomId: string, message: string) {
    this.socket?.emit('chat-message', { roomId, message });
  }

  // Event listeners
  onRoomJoined(callback: (data: any) => void) {
    this.socket?.on('room-joined', callback);
  }

  onUserJoined(callback: (data: any) => void) {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback: (data: any) => void) {
    this.socket?.on('user-left', callback);
  }

  onCodeUpdate(callback: (data: { code: string; changes: object; userId: string }) => void) {
    this.socket?.on('code-update', callback);
  }

  onCursorUpdate(callback: (data: { userId: string; username: string; position: { lineNumber: number; column: number } }) => void) {
    this.socket?.on('cursor-update', callback);
  }

  onLanguageChanged(callback: (data: { language: string; userId: string }) => void) {
    this.socket?.on('language-changed', callback);
  }

  onExecutionResult(callback: (result: ExecutionResult) => void) {
    this.socket?.on('execution-result', callback);
  }

  onChatMessage(callback: (message: ChatMessage) => void) {
    this.socket?.on('chat-message', callback);
  }

  // Remove listeners
  offCodeUpdate() {
    this.socket?.off('code-update');
  }

  offCursorUpdate() {
    this.socket?.off('cursor-update');
  }

  offLanguageChanged() {
    this.socket?.off('language-changed');
  }

  offExecutionResult() {
    this.socket?.off('execution-result');
  }

  offChatMessage() {
    this.socket?.off('chat-message');
  }

  offRoomEvents() {
    this.socket?.off('room-joined');
    this.socket?.off('user-joined');
    this.socket?.off('user-left');
  }
}

export default new SocketService();

