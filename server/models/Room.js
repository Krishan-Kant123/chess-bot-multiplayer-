import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  player1: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    guestId: {
      type: String,
      default: null
    },
    guestUsername: {
      type: String,
      default: null
    },
    color: {
      type: String,
      enum: ['white', 'black'],
      default: null
    },
    timeLeft: {
      type: Number, // in seconds, -1 for unlimited
      default: -1
    },
    isReady: {
      type: Boolean,
      default: false
    }
  },
  player2: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    guestId: {
      type: String,
      default: null
    },
    guestUsername: {
      type: String,
      default: null
    },
    color: {
      type: String,
      enum: ['white', 'black'],
      default: null
    },
    timeLeft: {
      type: Number, // in seconds, -1 for unlimited
      default: -1
    },
    isReady: {
      type: Boolean,
      default: false
    }
  },
  gameStatus: {
    type: String,
    enum: ['waiting', 'in_progress', 'paused', 'finished', 'abandoned'],
    default: 'waiting'
  },
  currentTurn: {
    type: String,
    enum: ['white', 'black'],
    default: 'white'
  },
  timeControl: {
    type: Number, // in seconds, -1 for unlimited
    default: 600 // 10 minutes default
  },
  matchType: {
    type: String,
    enum: ['casual', 'rated', 'ai'],
    default: 'casual'
  },
  gameData: {
    fen: {
      type: String,
      default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    },
    pgn: {
      type: String,
      default: ''
    },
    moves: [{
      from: String,
      to: String,
      piece: String,
      timestamp: Date,
      timeLeft: Number
    }]
  },
  result: {
    winner: {
      type: String,
      enum: ['white', 'black', 'draw', null],
      default: null
    },
    reason: {
      type: String,
      enum: ['checkmate', 'stalemate', 'timeout', 'resignation', 'draw_agreement', 'insufficient_material', 'abandonment', 'fifty_move_rule', 'threefold_repetition'],
      default: null
    }
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  aiLevel: {
    type: Number,
    min: 1,
    max: 20,
    default: 5
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

roomSchema.index({ roomId: 1 });
roomSchema.index({ 'player1.userId': 1 });
roomSchema.index({ 'player2.userId': 1 });
roomSchema.index({ gameStatus: 1 });
roomSchema.index({ matchType: 1, timeControl: 1 });

export default mongoose.model('Room', roomSchema);