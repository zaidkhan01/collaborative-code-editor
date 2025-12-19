const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [100, 'Room name cannot exceed 100 characters']
  },
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  language: {
    type: String,
    default: 'javascript',
    enum: ['javascript', 'python', 'java', 'cpp', 'go']
  },
  code: {
    type: String,
    default: '// Start coding here...'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: null
  },
  maxParticipants: {
    type: Number,
    default: 10,
    max: 50
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Update lastActivity on save
roomSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

// Index for faster queries
roomSchema.index({ roomId: 1 });
roomSchema.index({ owner: 1 });
roomSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Room', roomSchema);

