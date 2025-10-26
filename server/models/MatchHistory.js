import mongoose from 'mongoose';

const matchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  opponentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for AI games
  },
  roomId: {
    type: String,
    required: true
  },
  result: {
    type: String,
    enum: ['win', 'loss', 'draw'],
    required: true
  },
  userColor: {
    type: String,
    enum: ['white', 'black'],
    required: true
  },
  matchType: {
    type: String,
    enum: ['casual', 'rated', 'ai'],
    required: true
  },
  timeControl: {
    type: Number,
    required: true
  },
  ratingBefore: {
    type: Number,
    required: true
  },
  ratingAfter: {
    type: Number,
    required: true
  },
  ratingChange: {
    type: Number,
    default: 0
  },
  gameData: {
    pgn: String,
    finalFen: String,
    moveCount: Number,
    gameDuration: Number // in seconds
  },
  endReason: {
    type: String,
    enum: ['checkmate', 'stalemate', 'timeout', 'resignation', 'draw_agreement', 'insufficient_material'],
    required: true
  }
}, {
  timestamps: true
});

matchHistorySchema.index({ userId: 1, createdAt: -1 });
matchHistorySchema.index({ opponentId: 1, createdAt: -1 });
matchHistorySchema.index({ matchType: 1 });

export default mongoose.model('MatchHistory', matchHistorySchema);