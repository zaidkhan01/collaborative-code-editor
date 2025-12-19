const { createClient } = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis client connecting...');
      });

      this.client.on('ready', () => {
        console.log('Redis client ready');
        this.isConnected = true;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Redis connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Room operations
  async setRoomCode(roomId, code) {
    if (!this.isConnected) return;
    await this.client.set(`room:${roomId}:code`, code);
  }

  async getRoomCode(roomId) {
    if (!this.isConnected) return null;
    return await this.client.get(`room:${roomId}:code`);
  }

  // Cursor positions
  async setCursor(roomId, userId, position) {
    if (!this.isConnected) return;
    await this.client.hSet(`room:${roomId}:cursors`, userId, JSON.stringify(position));
  }

  async getCursors(roomId) {
    if (!this.isConnected) return {};
    const cursors = await this.client.hGetAll(`room:${roomId}:cursors`);
    const parsed = {};
    for (const [userId, position] of Object.entries(cursors)) {
      parsed[userId] = JSON.parse(position);
    }
    return parsed;
  }

  async removeCursor(roomId, userId) {
    if (!this.isConnected) return;
    await this.client.hDel(`room:${roomId}:cursors`, userId);
  }

  // Participants
  async addParticipant(roomId, userId, userData) {
    if (!this.isConnected) return;
    await this.client.hSet(`room:${roomId}:participants`, userId, JSON.stringify(userData));
  }

  async removeParticipant(roomId, userId) {
    if (!this.isConnected) return;
    await this.client.hDel(`room:${roomId}:participants`, userId);
  }

  async getParticipants(roomId) {
    if (!this.isConnected) return {};
    const participants = await this.client.hGetAll(`room:${roomId}:participants`);
    const parsed = {};
    for (const [userId, data] of Object.entries(participants)) {
      parsed[userId] = JSON.parse(data);
    }
    return parsed;
  }

  // Cleanup room data
  async cleanupRoom(roomId) {
    if (!this.isConnected) return;
    await this.client.del(`room:${roomId}:code`);
    await this.client.del(`room:${roomId}:cursors`);
    await this.client.del(`room:${roomId}:participants`);
  }
}

module.exports = new RedisService();

