import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,  // Made optional for guests
    default: null
  },
  guestId: {
    type: String,
    required: false,  // For guest users
    default: null
  },
  guestUsername: {
    type: String,
    required: false,
    default: null
  },
  matchType: {
    type: String,
    enum: ['casual', 'rated'],
    required: true
  },
  timeControl: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  preferredColor: {
    type: String,
    enum: ['white', 'black', 'random'],
    default: 'random'
  },
  socketId: {
    type: String,
    required: true
  },
  isGuest: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Custom validation: either userId or guestId must be present
queueSchema.pre('validate', function(next) {
  if (!this.userId && !this.guestId) {
    next(new Error('Either userId or guestId is required'));
  } else {
    next();
  }
});

queueSchema.index({ matchType: 1, timeControl: 1, rating: 1 });
queueSchema.index({ userId: 1 });
queueSchema.index({ guestId: 1 });
queueSchema.index({ socketId: 1 });

export default mongoose.model('Queue', queueSchema);