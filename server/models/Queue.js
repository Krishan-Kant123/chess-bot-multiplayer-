import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  }
}, {
  timestamps: true
});

queueSchema.index({ matchType: 1, timeControl: 1, rating: 1 });
queueSchema.index({ userId: 1 });

export default mongoose.model('Queue', queueSchema);