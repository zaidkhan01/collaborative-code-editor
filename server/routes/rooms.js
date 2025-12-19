const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const { authenticate } = require('../middleware/auth');

// Create room
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, language = 'javascript', isPrivate = false } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const roomId = uuidv4().slice(0, 8);

    const room = new Room({
      name,
      roomId,
      owner: req.user.id,
      language,
      isPrivate,
      participants: [{ user: req.user.id }]
    });

    await room.save();
    await room.populate('owner', 'username email');

    res.status(201).json({
      message: 'Room created successfully',
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        language: room.language,
        owner: room.owner,
        code: room.code,
        participants: room.participants,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get user's rooms
router.get('/', authenticate, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { owner: req.user.id },
        { 'participants.user': req.user.id }
      ]
    })
    .populate('owner', 'username email')
    .sort({ lastActivity: -1 });

    res.json({ rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// Get room by ID
router.get('/:roomId', authenticate, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate('owner', 'username email')
      .populate('participants.user', 'username email');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        language: room.language,
        owner: room.owner,
        code: room.code,
        participants: room.participants,
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Update room
router.put('/:roomId', authenticate, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { name, language } = req.body;

    if (name) room.name = name;
    if (language) room.language = language;

    await room.save();

    res.json({
      message: 'Room updated',
      room: {
        id: room._id,
        roomId: room.roomId,
        name: room.name,
        language: room.language
      }
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room
router.delete('/:roomId', authenticate, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await room.deleteOne();

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

module.exports = router;

