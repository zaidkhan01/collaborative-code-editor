const Room = require('../models/Room');
const RedisService = require('./redisService');
const CodeExecutor = require('./codeExecutor');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.codeExecutor = new CodeExecutor();
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user.username} (${socket.id})`);

      // Join room
      socket.on('join-room', async (roomId) => {
        try {
          const room = await Room.findOne({ roomId })
            .populate('owner', 'username email')
            .populate('participants.user', 'username email');

          if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
          }

          // Add user to room participants if not already there
          const isParticipant = room.participants.some(
            p => p.user && p.user._id.toString() === socket.user.id
          );

          if (!isParticipant) {
            room.participants.push({ user: socket.user.id });
            await room.save();
          }

          socket.join(roomId);
          socket.roomId = roomId;

          // Add to Redis
          await RedisService.addParticipant(roomId, socket.user.id, {
            id: socket.user.id,
            username: socket.user.username,
            socketId: socket.id
          });

          // Get cursors from Redis
          const cursors = await RedisService.getCursors(roomId);

          // Notify others
          socket.to(roomId).emit('user-joined', {
            user: { id: socket.user.id, username: socket.user.username },
            participants: room.participants
          });

          // Send room data to the user
          socket.emit('room-joined', {
            room: {
              id: room._id,
              roomId: room.roomId,
              name: room.name,
              language: room.language,
              owner: room.owner,
              code: room.code,
              participants: room.participants
            },
            cursors
          });

          console.log(`${socket.user.username} joined room: ${roomId}`);
        } catch (error) {
          console.error('Join room error:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Leave room
      socket.on('leave-room', async (roomId) => {
        await this.handleLeaveRoom(socket, roomId);
      });

      // Code change
      socket.on('code-change', async (data) => {
        const { roomId, code, changes } = data;

        try {
          // Update in database
          await Room.findOneAndUpdate(
            { roomId },
            { code, lastActivity: new Date() }
          );

          // Update in Redis
          await RedisService.setRoomCode(roomId, code);

          // Broadcast to others in the room
          socket.to(roomId).emit('code-update', { code, changes, userId: socket.user.id });
        } catch (error) {
          console.error('Code change error:', error);
        }
      });

      // Cursor move
      socket.on('cursor-move', async (data) => {
        const { roomId, position } = data;

        try {
          await RedisService.setCursor(roomId, socket.user.id, {
            position,
            username: socket.user.username
          });

          socket.to(roomId).emit('cursor-update', {
            userId: socket.user.id,
            username: socket.user.username,
            position
          });
        } catch (error) {
          console.error('Cursor move error:', error);
        }
      });

      // Language change
      socket.on('language-change', async (data) => {
        const { roomId, language } = data;

        try {
          await Room.findOneAndUpdate({ roomId }, { language });

          this.io.to(roomId).emit('language-changed', { language, userId: socket.user.id });
        } catch (error) {
          console.error('Language change error:', error);
        }
      });

      // Execute code
      socket.on('execute-code', async (data) => {
        const { roomId, code, language } = data;

        try {
          console.log(`Executing ${language} code for room ${roomId}`);
          const result = await this.codeExecutor.execute(code, language);

          this.io.to(roomId).emit('execution-result', result);
        } catch (error) {
          console.error('Execute code error:', error);
          this.io.to(roomId).emit('execution-result', {
            success: false,
            output: '',
            error: error.message,
            executionTime: 0
          });
        }
      });

      // Chat message
      socket.on('chat-message', async (data) => {
        const { roomId, message } = data;

        const chatMessage = {
          id: Date.now().toString(),
          userId: socket.user.id,
          username: socket.user.username,
          message,
          timestamp: new Date().toISOString()
        };

        this.io.to(roomId).emit('chat-message', chatMessage);
      });

      // Disconnect
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.user.username} (${socket.id})`);

        if (socket.roomId) {
          await this.handleLeaveRoom(socket, socket.roomId);
        }
      });
    });
  }

  async handleLeaveRoom(socket, roomId) {
    try {
      socket.leave(roomId);

      // Remove from Redis
      await RedisService.removeParticipant(roomId, socket.user.id);
      await RedisService.removeCursor(roomId, socket.user.id);

      // Get updated room
      const room = await Room.findOne({ roomId })
        .populate('participants.user', 'username email');

      // Notify others
      socket.to(roomId).emit('user-left', {
        userId: socket.user.id,
        username: socket.user.username,
        participants: room ? room.participants : []
      });

      console.log(`${socket.user.username} left room: ${roomId}`);
    } catch (error) {
      console.error('Leave room error:', error);
    }
  }
}

module.exports = SocketHandler;

