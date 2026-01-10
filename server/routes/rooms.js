import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room.js';
import User from '../models/User.js';
import MatchHistory from '../models/MatchHistory.js';
import auth from '../middleware/auth.js';
import { calculateRatingChange, getKFactor } from '../utils/rating.js';

const router = express.Router();

// Create a new room
// Create a new room
router.post('/create', auth, async (req, res) => {
  try {
    const { timeControl, matchType, isPrivate, aiLevel, isGuest, guestUsername } = req.body;
console.log("here")
    const roomId = uuidv4();
    const room = new Room({
      roomId,
      timeControl: timeControl || 600,
      matchType: matchType || 'casual',
      isPrivate: isPrivate || false,
      aiLevel: matchType === 'ai' ? (aiLevel || 5) : undefined
    });

    const userIsWhite = Math.random() < 0.5;
    room.player1.color = userIsWhite ? 'white' : 'black';
    room.player2.color = userIsWhite ? 'black' : 'white';
    console.log(room);

    if (isGuest) {
      room.player1.guestId = guestUsername;
      room.player1.guestUsername = guestUsername;
    } else {
      room.player1.userId = req.user._id;
    }

    room.player1.timeLeft = timeControl === -1 ? -1 : timeControl;

    if (matchType === 'ai') {
      room.player2.timeLeft = timeControl; // AI has unlimited time
      room.gameStatus = 'in_progress';
    } else {
      room.player2.timeLeft = timeControl === -1 ? -1 : timeControl;
    }
 const u = await User.findById(room.player1.userId);
    const v = await User.findById(room.player2.userId);
    room.player1.guestUsername = u ? u.username : room.player1.guestUsername;
    room.player2.guestUsername = v ? v.username : room.player2.guestUsername;
    await room.save();
    await room.populate('player1.userId player2.userId', 'username rating');

    res.status(201).json({ room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Failed to create room' });
  }
});


// Join a room
router.post('/join/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId }).populate('player1.userId player2.userId', 'username rating');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (room.gameStatus !== 'waiting') {
      return res.status(400).json({ message: 'Room is not available for joining' });
    }
    if (room.matchType === 'ai') {
      return res.status(400).json({ message: 'Cannot join AI room' });
    }
    
    if (room.player1.userId && room.player1.userId._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You are already in this room' });
    }
    
    if (room.player1.userId && !room.player2.userId) {
      room.player2.userId = req.user._id;
      room.player2.timeLeft = room.timeControl === -1 ? -1 : room.timeControl;
      
      // Colors are already assigned during creation; do not reassign
      room.gameStatus = 'in_progress';
      
    } else if (!room.player1.userId) {
      room.player1.userId = req.user._id;
      room.player1.timeLeft = room.timeControl === -1 ? -1 : room.timeControl;
      
      // If colors missing (room created improperly), assign safely
      if (!room.player1.color || !room.player2.color) {
        const userIsWhite = Math.random() < 0.5;
        room.player1.color = userIsWhite ? 'white' : 'black';
        room.player2.color = userIsWhite ? 'black' : 'white';
      }
      
    } else {
      return res.status(400).json({ message: 'Room is full' });
    }
    const u = await User.findById(room.player1.userId);
    const v = await User.findById(room.player2.userId);
    room.player1.guestUsername = u ? u.username : room.player1.guestUsername;
    room.player2.guestUsername = v ? v.username : room.player2.guestUsername;
    console.log(room);
    await room.save();
    await room.populate('player1.userId player2.userId', 'username rating');

    res.json({ room });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Failed to join room' });
  }
});

// Get room details
router.get('/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId }).populate('player1.userId player2.userId', 'username rating');
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user has access to this room
    const hasAccess = 
      (room.player1.userId && room.player1.userId._id.toString() === req.user._id.toString()) ||
      (room.player2.userId && room.player2.userId._id.toString() === req.user._id.toString()) ||
      !room.isPrivate;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Failed to get room details' });
  }
});

// Get user's match history
router.get('/history/matches', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const matches = await MatchHistory.find({ userId: req.user._id })
      .populate('opponentId', 'username rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MatchHistory.countDocuments({ userId: req.user._id });

    res.json({
      matches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get match history error:', error);
    res.status(500).json({ message: 'Failed to get match history' });
  }
});

// Get a specific match for analysis/replay
router.get('/history/match/:matchId', auth, async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await MatchHistory.findById(matchId)
      .populate('opponentId', 'username rating')
      .populate('userId', 'username rating');
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    // Verify user has access (they must be the user or opponent)
    const isOwner = match.userId._id.toString() === req.user._id.toString();
    const isOpponent = match.opponentId && match.opponentId._id.toString() === req.user._id.toString();
    
    if (!isOwner && !isOpponent) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({ match });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ message: 'Failed to get match details' });
  }
});

// Get match by room ID (for both users who played)
router.get('/history/room/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Find the match for this user in this room
    const match = await MatchHistory.findOne({ 
      roomId,
      userId: req.user._id 
    })
      .populate('opponentId', 'username rating');
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    res.json({ match });
  } catch (error) {
    console.error('Get match by room error:', error);
    res.status(500).json({ message: 'Failed to get match details' });
  }
});

export default router;