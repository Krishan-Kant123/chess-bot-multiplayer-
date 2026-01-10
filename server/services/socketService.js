import jwt from 'jsonwebtoken';
import { Chess } from 'chess.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Queue from '../models/Queue.js';
import MatchHistory from '../models/MatchHistory.js';
import StockfishAPI from '../utils/stockfish.js';
import { calculateRatingChange, getKFactor } from '../utils/rating.js';
import { v4 as uuidv4 } from 'uuid';

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map();       // socketId -> User object
    this.roomTimers = new Map();           // roomId -> { timer, lastTick }
    this.roomCache = new Map();            // roomId -> Room object
    this.disconnectTimers = new Map();     // roomId -> { playerId, timer } for grace period
    this.userRooms = new Map();            // userId/guestId -> roomId (for reconnection)
    this.moveRateLimiter = new Map();      // socketId -> lastMoveTime
    
    // Cache cleanup interval (every 5 minutes, clear finished games older than 10 mins)
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000);
  }

  // Cleanup old finished games from cache to prevent memory leak
  cleanupCache() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    for (const [roomId, room] of this.roomCache.entries()) {
      if (room.gameStatus === 'finished' || room.gameStatus === 'abandoned') {
        const roomAge = now - new Date(room.lastActivity || room.updatedAt).getTime();
        if (roomAge > maxAge) {
          this.roomCache.delete(roomId);
          this.roomTimers.delete(roomId);
          console.log(`Cleaned up room ${roomId} from cache`);
        }
      }
    }
  }

  // Generate a unique room ID with collision check
  async generateUniqueRoomId() {
    let roomId;
    let attempts = 0;
    const maxAttempts = 5;
    
    do {
      roomId = uuidv4();
      attempts++;
      
      // Check if already exists (extremely unlikely with UUID)
      const existing = await Room.findOne({ roomId });
      if (!existing) {
        return roomId;
      }
      console.warn(`Room ID collision detected (attempt ${attempts}): ${roomId}`);
    } while (attempts < maxAttempts);
    
    // This should essentially never happen
    throw new Error('Failed to generate unique room ID after maximum attempts');
  }

  // Generate a short, human-friendly room code for easy sharing
  // Format: XXXX-XXXX (e.g., "GAME-A7K9")
  async generateShortRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0/O, 1/I
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const roomCode = `${code.slice(0, 4)}-${code.slice(4)}`;
      
      // Check if exists
      const existing = await Room.findOne({ roomId: roomCode });
      if (!existing) {
        return roomCode;
      }
      attempts++;
    } while (attempts < maxAttempts);
    
    // Fallback to UUID if short codes are exhausted (very unlikely)
    return uuidv4();
  }

  async authenticateSocket(socket, token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) return false;
      
      this.connectedUsers.set(socket.id, user);
      user.isOnline = true;
      await user.save();
      
      return user;
    } catch (error) {
      return false;
    }
  }

  async handleConnection(socket) {
    console.log('Socket connected:', socket.id);

    // Authentication (optional for guest users)
    socket.on('authenticate', async (token) => {
      const user = await this.authenticateSocket(socket, token);
      if (user) {
        socket.userId = user._id;
        socket.isGuest = false;
        socket.emit('authenticated', { user: this.formatUser(user) });
        
        // Check for active game to rejoin (reconnection support)
        await this.handleReconnection(socket, user._id.toString());
      } else {
        socket.emit('authentication_error', { message: 'Invalid token' });
      }
    });

    // Guest authentication - with persistent guest ID for reconnection
    socket.on('authenticate_guest', async (data) => {
      const { username, guestId: existingGuestId } = data;
      console.log("guest auth", username, existingGuestId);
      
      if (!username || username.trim().length < 2) {
        socket.emit('authentication_error', { message: 'Username must be at least 2 characters' });
        return;
      }
      
      // Use existing guestId if provided (for reconnection), otherwise generate new one
      const guestId = existingGuestId || `guest_${uuidv4()}`;
      
      socket.guestId = guestId;
      socket.guestUsername = username.trim();
      socket.isGuest = true;
      
      socket.emit('authenticated', { 
        user: { 
          id: guestId,  // Use persistent guestId instead of socket.id
          username: socket.guestUsername, 
          rating: 600, 
          isGuest: true,
          guestId: guestId  // Send back for client to store
        } 
      });
      
      // Check for active game to rejoin (reconnection support for guests)
      await this.handleReconnection(socket, guestId);
    });

    // Guest create room - allows guests to create rooms via socket
    socket.on('create_room', async (data) => {
      if (!socket.userId && !socket.isGuest) {
        socket.emit('error', { message: 'Please authenticate first' });
        return;
      }
      
      const { timeControl, matchType, isPrivate, aiLevel, preferredColor } = data;
      
      // Guests can only create casual or AI games
      if (socket.isGuest && matchType === 'rated') {
        socket.emit('error', { message: 'Guests cannot create rated games. Please login.' });
        return;
      }
      
      try {
        // Use short shareable code for private rooms (easier to share with friends)
        // Use UUID for regular/matchmaking rooms
        const roomId = isPrivate 
          ? await this.generateShortRoomCode()  // e.g., "ABCD-1234"
          : await this.generateUniqueRoomId();   // UUID
        
        const room = new Room({
          roomId,
          timeControl: timeControl || 600,
          matchType: matchType || 'casual',
          isPrivate: isPrivate || false,
          aiLevel: matchType === 'ai' ? (aiLevel || 5) : undefined
        });
        
        // Assign colors based on user preference
        let userIsWhite;
        if (preferredColor === 'white') {
          userIsWhite = true;
          console.log('User requested WHITE, assigning white to player1');
        } else if (preferredColor === 'black') {
          userIsWhite = false;
          console.log('User requested BLACK, assigning black to player1');
        } else {
          // Random if not specified or 'random'
          userIsWhite = Math.random() < 0.5;
          console.log('Random color assignment:', userIsWhite ? 'white' : 'black');
        }
        
        room.player1.color = userIsWhite ? 'white' : 'black';
        room.player2.color = userIsWhite ? 'black' : 'white';
        room.player1.timeLeft = timeControl === -1 ? -1 : (timeControl || 600);
        
        if (socket.isGuest) {
          room.player1.guestId = socket.guestId;
          room.player1.guestUsername = socket.guestUsername;
        } else {
          room.player1.userId = socket.userId;
          const user = await User.findById(socket.userId);
          room.player1.guestUsername = user?.username;
        }
        
        if (matchType === 'ai') {
          room.player2.timeLeft = timeControl === -1 ? -1 : (timeControl || 600);
          room.player2.guestUsername = `Stockfish (Level ${aiLevel || 5})`;
          room.gameStatus = 'in_progress';
        } else {
          room.player2.timeLeft = timeControl === -1 ? -1 : (timeControl || 600);
        }
        
        await room.save();
        this.roomCache.set(roomId, room);
        
        // Track user's room for reconnection
        const playerId = socket.userId?.toString() || socket.guestId;
        this.userRooms.set(playerId, roomId);
        
        // Auto-join the room
        socket.join(roomId);
        socket.currentRoom = roomId;
        
        socket.emit('room_created', { 
          room: this.formatRoom(room),
          message: matchType === 'ai' ? 'AI game started!' : 'Room created. Share the room ID with a friend!'
        });
        
        // Start timer for AI games
        if (matchType === 'ai' && room.timeControl > 0) {
          this.startGameTimer(roomId);
        }
        
        // If AI has white, make first move immediately
        // AI could be player1 or player2 depending on user's color choice
        if (matchType === 'ai') {
          const aiIsPlayer1 = room.player1.guestUsername?.includes('Stockfish');
          const aiIsPlayer2 = room.player2.guestUsername?.includes('Stockfish');
          
          if ((aiIsPlayer1 && room.player1.color === 'white') || 
              (aiIsPlayer2 && room.player2.color === 'white')) {
            console.log('AI has white, making first move after 1 second...');
            setTimeout(() => this.makeAIMove(roomId), 1000);
          } else {
            console.log('AI has black, waiting for user to move first');
          }
        }
        
        console.log(`Room ${roomId} created by ${socket.isGuest ? 'guest' : 'user'}: ${socket.guestUsername || socket.userId}`);
      } catch (error) {
        console.error('Socket create room error:', error);
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    // Guest join room - allows guests to join rooms as player 2
    socket.on('join_room_as_player', async (data) => {
      if (!socket.userId && !socket.isGuest) {
        socket.emit('error', { message: 'Please authenticate first' });
        return;
      }
      
      const { roomId } = data;
      
      try {
        let room = this.roomCache.get(roomId);
        if (!room) {
          room = await Room.findOne({ roomId }).populate('player1.userId player2.userId', 'username rating');
          if (room) {
            this.roomCache.set(roomId, room);
          }
        }
        
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }
        
        if (room.gameStatus !== 'waiting') {
          socket.emit('error', { message: 'Room is not available for joining' });
          return;
        }
        
        if (room.matchType === 'ai') {
          socket.emit('error', { message: 'Cannot join AI room' });
          return;
        }
        
        // Check if already in room
        const playerId = socket.userId?.toString() || socket.guestId;
        if (room.player1.userId?.toString() === playerId || room.player1.guestId === playerId) {
          socket.emit('error', { message: 'You are already in this room' });
          return;
        }
        
        // Guests can't join rated games
        if (socket.isGuest && room.matchType === 'rated') {
          socket.emit('error', { message: 'Guests cannot join rated games. Please login.' });
          return;
        }
        
        // Join as player 2
        if (socket.isGuest) {
          room.player2.guestId = socket.guestId;
          room.player2.guestUsername = socket.guestUsername;
        } else {
          room.player2.userId = socket.userId;
          const user = await User.findById(socket.userId);
          room.player2.guestUsername = user?.username;
        }
        
        room.player2.timeLeft = room.timeControl === -1 ? -1 : room.timeControl;
        room.gameStatus = 'in_progress';
        
        await room.save();
        this.roomCache.set(roomId, room);
        
        // Track user's room for reconnection
        this.userRooms.set(playerId, roomId);
        
        // Join socket room
        socket.join(roomId);
        socket.currentRoom = roomId;
        
        // Notify both players
        this.io.to(roomId).emit('game_started', { 
          room: this.formatRoom(room),
          message: 'Game started!'
        });
        
        // Start timer
        if (room.timeControl > 0) {
          this.startGameTimer(roomId);
        }
        
        console.log(`${socket.isGuest ? 'Guest' : 'User'} ${socket.guestUsername || socket.userId} joined room ${roomId}`);
      } catch (error) {
        console.error('Socket join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Join room
    socket.on('join_room', async (data) => {
      if (!socket.userId && !socket.isGuest) return;
      
      const { roomId } = data;
      let room = this.roomCache.get(roomId);
      
      if (!room) {
        room = await Room.findOne({ roomId }).populate('player1.userId player2.userId', 'username rating');
        if (room) {
          this.roomCache.set(roomId, room);
        }
      }
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      socket.join(roomId);
      socket.currentRoom = roomId;
      
      // Track user's room for reconnection
      const playerId = socket.userId?.toString() || socket.guestId || socket.id;
      this.userRooms.set(playerId, roomId);
      
      // Cancel any disconnect timer for this player
      this.cancelDisconnectTimer(roomId, playerId);
      
      // Emit to room immediately without database query
      this.io.to(roomId).emit('room_update', { room: this.formatRoom(room) });
      
      // Start game timer if game is in progress
      if (room.gameStatus === 'in_progress' && room.timeControl > 0) {
        this.startGameTimer(roomId);
      }
    });

    // Make move - with turn validation and rate limiting
    socket.on('make_move', async (data) => {
      if (!socket.userId && !socket.isGuest) return;
      
      // Rate limiting - minimum 100ms between moves
      const now = Date.now();
      const lastMove = this.moveRateLimiter.get(socket.id) || 0;
      if (now - lastMove < 100) {
        return; // Ignore rapid fire moves
      }
      this.moveRateLimiter.set(socket.id, now);
      
      const { roomId, move } = data;
      let room = this.roomCache.get(roomId);
      
      if (!room) {
        room = await Room.findOne({ roomId }).populate('player1.userId player2.userId', 'username rating');
        if (room) {
          this.roomCache.set(roomId, room);
        }
      }
      
      if (!room) return;
      
      // Check if game is still in progress
      if (room.gameStatus !== 'in_progress') {
        socket.emit('invalid_move', { message: 'Game is not in progress' });
        return;
      }
      
      // CRITICAL FIX: Turn validation - verify it's this player's turn
      const playerColor = this.getPlayerColor(room, socket.userId?.toString() || socket.guestId || socket.id);
      if (!playerColor) {
        socket.emit('invalid_move', { message: 'You are not a player in this game' });
        return;
      }
      if (playerColor !== room.currentTurn) {
        socket.emit('invalid_move', { message: 'Not your turn' });
        return;
      }
      
      const chess = new Chess(room.gameData.fen);
      
      // Validate move immediately
      try {
        const validMove = chess.move(move);
        if (!validMove) {
          socket.emit('invalid_move', { message: 'Invalid move' });
          return;
        }

        // Update room data
        room.gameData.fen = chess.fen();
        room.gameData.pgn = chess.pgn();
        room.gameData.moves.push({
          from: move.from,
          to: move.to,
          piece: validMove.piece,
          timestamp: new Date(),
          timeLeft: this.getPlayerTimeLeft(room, socket.userId || socket.guestId || socket.id)
        });
        
        room.currentTurn = chess.turn() === 'w' ? 'white' : 'black';
        room.lastActivity = new Date();
        
        // Update cache immediately
        this.roomCache.set(roomId, room);
        
        // Emit move immediately to all players
        this.io.to(roomId).emit('move_made', {
          move: validMove,
          fen: room.gameData.fen,
          pgn: room.gameData.pgn,
          currentTurn: room.currentTurn,
          gameStatus: room.gameStatus
        });
        
        // Check for game end (including 50-move rule and other draw conditions)
        if (chess.isGameOver()) {
          await this.endGame(room, this.getGameResult(chess));
        }
        
        // Save to database asynchronously (non-blocking)
        setImmediate(async () => {
          try {
            await room.save();
          } catch (error) {
            console.error('Error saving room:', error);
          }
        });

        // Handle AI move if it's an AI game
        if (room.matchType === 'ai' && !chess.isGameOver()) {
          setTimeout(() => this.makeAIMove(roomId), 500); // Reduced delay
        }
      } catch (error) {
        socket.emit('invalid_move', { message: 'Invalid move' });
      }
    });

    // Chat message
    socket.on('send_message', async (data) => {
      if (!socket.userId && !socket.isGuest) return;
      
      const { roomId, message } = data;
      const room = this.roomCache.get(roomId) || await Room.findOne({ roomId });
      
      if (!room || room.matchType === 'ai') return; // No chat in AI games
      
      const username = socket.isGuest ? socket.guestUsername : 
        (this.connectedUsers.get(socket.id)?.username || 'Unknown');
      
      const chatMessage = {
        id: uuidv4(),
        username,
        message: message.trim(),
        timestamp: new Date(),
        isGuest: socket.isGuest || false
      };
      
      this.io.to(roomId).emit('chat_message', chatMessage);
    });

    // Join matchmaking queue - supports both authenticated users and guests
    socket.on('join_queue', async (data) => {
      if (!socket.userId && !socket.isGuest) {
        socket.emit('error', { message: 'Please authenticate first' });
        return;
      }
      
      console.log("join queue", data);
      
      const { matchType, timeControl, preferredColor } = data;
      
      // Guests can only join casual queues
      if (socket.isGuest && matchType === 'rated') {
        socket.emit('error', { message: 'Guests can only join casual games. Please login for rated games.' });
        return;
      }
      
      let rating = 600; // Default rating for guests
      
      if (socket.userId) {
        const user = await User.findById(socket.userId);
        rating = user?.rating || 600;
        // Remove from existing queue (by userId)
        await Queue.deleteMany({ userId: socket.userId });
      } else if (socket.guestId) {
        // Remove from existing queue (by guestId)
        await Queue.deleteMany({ guestId: socket.guestId });
      }
      
      // Add to queue
      const queueEntry = new Queue({
        userId: socket.userId || null,
        guestId: socket.isGuest ? socket.guestId : null,
        guestUsername: socket.isGuest ? socket.guestUsername : null,
        matchType,
        timeControl,
        rating,
        preferredColor: preferredColor || 'random',
        socketId: socket.id,
        isGuest: socket.isGuest || false
      });
      
      await queueEntry.save();
      
      // Try to find a match immediately
      const match = await this.findMatch(queueEntry);
      if (match) {
        await this.createMatchFromQueue(match.player1, match.player2);
      }
      
      socket.emit('queue_joined', { message: 'Searching for opponent...' });
    });

    // Leave queue - supports both authenticated users and guests
    socket.on('leave_queue', async () => {
      if (socket.userId) {
        await Queue.deleteMany({ userId: socket.userId });
      } else if (socket.guestId) {
        await Queue.deleteMany({ guestId: socket.guestId });
      } else {
        await Queue.deleteMany({ socketId: socket.id });
      }
      socket.emit('queue_left', { message: 'Left matchmaking queue' });
    });

    // Resign game
    socket.on('resign', async (data) => {
      if (!socket.userId && !socket.isGuest) return;
      
      const { roomId } = data;
      let room = this.roomCache.get(roomId);
      
      if (!room) {
        room = await Room.findOne({ roomId }).populate('player1.userId player2.userId', 'username rating');
      }
      
      if (!room || room.gameStatus !== 'in_progress') return;
      
      const resigningPlayer = this.getPlayerColor(room, socket.userId?.toString() || socket.guestId || socket.id);
      const winner = resigningPlayer === 'white' ? 'black' : 'white';
      
      await this.endGame(room, { winner, reason: 'resignation' });
      
      this.io.to(roomId).emit('game_ended', {
        result: { winner, reason: 'resignation' },
        message: `${resigningPlayer} resigned`
      });
    });

    // Offer draw
    socket.on('offer_draw', async (data) => {
      const { roomId } = data;
      const username = socket.isGuest ? socket.guestUsername : 
        (this.connectedUsers.get(socket.id)?.username || 'Unknown');
      socket.to(roomId).emit('draw_offered', { from: socket.userId || socket.guestId || socket.id, username });
    });

    // Accept/decline draw
    socket.on('draw_response', async (data) => {
      const { roomId, accept } = data;
      
      if (accept) {
        let room = this.roomCache.get(roomId);
        if (!room) {
          room = await Room.findOne({ roomId }).populate('player1.userId player2.userId', 'username rating');
        }
        
        if (room) {
          await this.endGame(room, { winner: 'draw', reason: 'draw_agreement' });
          this.io.to(roomId).emit('game_ended', {
            result: { winner: 'draw', reason: 'draw_agreement' },
            message: 'Game drawn by mutual agreement'
          });
        }
      } else {
        socket.to(roomId).emit('draw_declined');
      }
    });

    // Handle disconnect - with grace period instead of immediate timer stop
    socket.on('disconnect', async () => {
      console.log('Socket disconnected:', socket.id);
      
      // Clean up rate limiter
      this.moveRateLimiter.delete(socket.id);
      
      if (socket.userId) {
        const user = await User.findById(socket.userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          await user.save();
        }
        
        this.connectedUsers.delete(socket.id);
      }
      
      // Remove from queue (works for both users and guests by socketId)
      await Queue.deleteMany({ socketId: socket.id });
      
      // CRITICAL FIX: Don't stop timer immediately - start grace period
      if (socket.currentRoom) {
        const playerId = socket.userId?.toString() || socket.guestId || socket.id;
        const room = this.roomCache.get(socket.currentRoom);
        
        if (room && room.gameStatus === 'in_progress') {
          // Start 60-second grace period for reconnection
          this.startDisconnectTimer(socket.currentRoom, playerId, 60);
          
          // Notify opponent
          this.io.to(socket.currentRoom).emit('opponent_disconnected', {
            message: 'Opponent disconnected. They have 60 seconds to reconnect.',
            graceSeconds: 60
          });
        }
      }
    });
  }

  // Handle player reconnection
  async handleReconnection(socket, playerId) {
    console.log(`🔄 Attempting reconnection for player: ${playerId}`);
    const roomId = this.userRooms.get(playerId);
    
    if (!roomId) {
      console.log(`❌ No active room found for player ${playerId}`);
      return;
    }
    
    console.log(`📍 Found room ${roomId} for player ${playerId}`);
    
    let room = this.roomCache.get(roomId);
    if (!room) {
      room = await Room.findOne({ roomId }).populate('player1.userId player2.userId', 'username rating');
      if (room) {
        this.roomCache.set(roomId, room);
      }
    }
    
    if (!room) {
      console.log(`❌ Room ${roomId} not found in database`);
      this.userRooms.delete(playerId);
      return;
    }
    
    console.log(`📊 Room ${roomId} status: ${room.gameStatus}`);
    
    if (room.gameStatus !== 'in_progress' && room.gameStatus !== 'waiting') {
      console.log(`❌ Room ${roomId} is not in progress or waiting (status: ${room.gameStatus})`);
      this.userRooms.delete(playerId);
      return;
    }
    
    // Cancel disconnect timer if any
    this.cancelDisconnectTimer(roomId, playerId);
    
    // Rejoin the room
    socket.join(roomId);
    socket.currentRoom = roomId;
    
    // Send full game state to reconnected player
    socket.emit('game_reconnected', {
      room: this.formatRoom(room),
      message: 'Reconnected to your game'
    });
    
    // Notify opponent
    socket.to(roomId).emit('opponent_reconnected', {
      message: 'Opponent has reconnected'
    });
    
    console.log(`✅ Player ${playerId} reconnected to room ${roomId}`);
  }

  // Start disconnect grace period timer
  startDisconnectTimer(roomId, playerId, graceSeconds) {
    const key = `${roomId}-${playerId}`;
    
    // Clear any existing timer
    if (this.disconnectTimers.has(key)) {
      clearTimeout(this.disconnectTimers.get(key).timer);
    }
    
    const timer = setTimeout(async () => {
      // Player didn't reconnect - forfeit them
      let room = this.roomCache.get(roomId);
      if (!room) {
        room = await Room.findOne({ roomId }).populate('player1.userId player2.userId', 'username rating');
      }
      
      if (room && room.gameStatus === 'in_progress') {
        const playerColor = this.getPlayerColor(room, playerId);
        const winner = playerColor === 'white' ? 'black' : 'white';
        
        await this.endGame(room, { winner, reason: 'abandonment' });
        
        this.io.to(roomId).emit('game_ended', {
          result: { winner, reason: 'abandonment' },
          message: `${playerColor} forfeited due to disconnection`
        });
      }
      
      this.disconnectTimers.delete(key);
    }, graceSeconds * 1000);
    
    this.disconnectTimers.set(key, { timer, playerId });
  }

  // Cancel disconnect timer (player reconnected)
  cancelDisconnectTimer(roomId, playerId) {
    const key = `${roomId}-${playerId}`;
    if (this.disconnectTimers.has(key)) {
      clearTimeout(this.disconnectTimers.get(key).timer);
      this.disconnectTimers.delete(key);
    }
  }

  async findMatch(queueEntry) {
    const ratingRange = 200; // ±200 rating points
    
    // Build query to exclude self (by userId or guestId)
    const excludeQuery = {};
    if (queueEntry.userId) {
      excludeQuery.userId = { $ne: queueEntry.userId };
    }
    if (queueEntry.guestId) {
      excludeQuery.guestId = { $ne: queueEntry.guestId };
    }
    // Also exclude by socketId to be safe
    excludeQuery.socketId = { $ne: queueEntry.socketId };
    
    const potentialMatches = await Queue.find({
      ...excludeQuery,
      matchType: queueEntry.matchType,
      timeControl: queueEntry.timeControl,
      rating: {
        $gte: queueEntry.rating - ratingRange,
        $lte: queueEntry.rating + ratingRange
      }
    }).sort({ createdAt: 1 }).limit(1);
    
    if (potentialMatches.length > 0) {
      return {
        player1: queueEntry,
        player2: potentialMatches[0]
      };
    }
    
    return null;
  }

  async createMatchFromQueue(player1Queue, player2Queue) {
    const roomId = uuidv4();
    const room = new Room({
      roomId,
      timeControl: player1Queue.timeControl,
      matchType: player1Queue.matchType,
      gameStatus: 'in_progress'
    });
  
    // Normalize preferences before assigning colors
    const pref1 = (player1Queue.preferredColor || 'random').toLowerCase();
    const pref2 = (player2Queue.preferredColor || 'random').toLowerCase();
  
    const player1IsWhite = this.assignColors(pref1, pref2);
  
    // Set player 1 (could be user or guest)
    if (player1Queue.userId) {
      room.player1.userId = player1Queue.userId;
    } else if (player1Queue.guestId) {
      room.player1.guestId = player1Queue.guestId;
      room.player1.guestUsername = player1Queue.guestUsername;
    }
    room.player1.timeLeft = player1Queue.timeControl === -1 ? -1 : player1Queue.timeControl;
    room.player1.color = player1IsWhite ? 'white' : 'black';
  
    // Set player 2 (could be user or guest)
    if (player2Queue.userId) {
      room.player2.userId = player2Queue.userId;
    } else if (player2Queue.guestId) {
      room.player2.guestId = player2Queue.guestId;
      room.player2.guestUsername = player2Queue.guestUsername;
    }
    room.player2.timeLeft = player2Queue.timeControl === -1 ? -1 : player2Queue.timeControl;
    room.player2.color = player1IsWhite ? 'black' : 'white';
  
    // Sanity check (extra safety)
    if (room.player1.color === room.player2.color) {
      room.player2.color = room.player1.color === 'white' ? 'black' : 'white';
    }
    
    // Set usernames for display
    if (room.player1.userId) {
      const u = await User.findById(room.player1.userId);
      room.player1.guestUsername = u?.username || 'Unknown';
    }
    if (room.player2.userId) {
      const v = await User.findById(room.player2.userId);
      room.player2.guestUsername = v?.username || 'Unknown';
    }
    
    await room.save();
    this.roomCache.set(roomId, room);
    
    // Track user rooms for reconnection (handle both users and guests)
    const player1Id = player1Queue.userId?.toString() || player1Queue.guestId;
    const player2Id = player2Queue.userId?.toString() || player2Queue.guestId;
    
    if (player1Id) this.userRooms.set(player1Id, roomId);
    if (player2Id) this.userRooms.set(player2Id, roomId);
  
    // Remove both from queue (by socketId is safest for both users and guests)
    await Queue.deleteMany({
      socketId: { $in: [player1Queue.socketId, player2Queue.socketId] }
    });
  
    // Notify players
    const player1Socket = this.io.sockets.sockets.get(player1Queue.socketId);
    const player2Socket = this.io.sockets.sockets.get(player2Queue.socketId);
  
    if (player1Socket) {
      player1Socket.emit('match_found', { roomId, color: room.player1.color });
    }
    if (player2Socket) {
      player2Socket.emit('match_found', { roomId, color: room.player2.color });
    }
  
    // Start timer if applicable
    if (room.timeControl > 0) {
      this.startGameTimer(roomId);
    }
    
    console.log(`Match created: ${player1Id} vs ${player2Id} in room ${roomId}`);
  }
  

  assignColors(pref1, pref2) {
    pref1 = pref1 || 'random';
    pref2 = pref2 || 'random';
  
    if (pref1 === 'white' && pref2 !== 'white') return true;
    if (pref2 === 'white' && pref1 !== 'white') return false;
    if (pref1 === 'black' && pref2 !== 'black') return false;
    if (pref2 === 'black' && pref1 !== 'black') return true;
  
    return Math.random() < 0.5;
  }
  

  async makeAIMove(roomId) {
    try {
      let room = this.roomCache.get(roomId);
      if (!room) {
        room = await Room.findOne({ roomId }).populate('player1.userId player2.userId', 'username rating');
        if (room) {
          this.roomCache.set(roomId, room);
        }
      }
      
      if (!room || room.gameStatus !== 'in_progress') return;
      
      const chess = new Chess(room.gameData.fen);
      const possibleMoves = chess.moves({ verbose: true });
      
      try {
        // Pass possible moves for fallback
        const aiResponse = await StockfishAPI.getBestMove(
          room.gameData.fen, 
          room.aiLevel,
          possibleMoves.map(m => m.san)
        );
        const aiMove = chess.move(aiResponse.bestmove);
        
        if (aiMove) {
          room.gameData.fen = chess.fen();
          room.gameData.pgn = chess.pgn();
          room.gameData.moves.push({
            from: aiMove.from,
            to: aiMove.to,
            piece: aiMove.piece,
            timestamp: new Date(),
            timeLeft: -1 // AI has unlimited time
          });
          
          room.currentTurn = chess.turn() === 'w' ? 'white' : 'black';
          room.lastActivity = new Date();
          
          // Update cache
          this.roomCache.set(roomId, room);
          
          // Emit immediately
          this.io.to(roomId).emit('move_made', {
            move: aiMove,
            fen: room.gameData.fen,
            pgn: room.gameData.pgn,
            currentTurn: room.currentTurn,
            gameStatus: room.gameStatus,
            isAIMove: true
          });
          
          // Check for game end
          if (chess.isGameOver()) {
            await this.endGame(room, this.getGameResult(chess));
          }
          
          // Save asynchronously
          setImmediate(async () => {
            try {
              await room.save();
            } catch (error) {
              console.error('Error saving AI move:', error);
            }
          });
        }
      } catch (error) {
        console.error('AI move error:', error);
        // Fallback to random move
        const moves = chess.moves({ verbose: true });
        if (moves.length > 0) {
          const randomMove = moves[Math.floor(Math.random() * moves.length)];
          const move = chess.move(randomMove);
          
          room.gameData.fen = chess.fen();
          room.gameData.pgn = chess.pgn();
          room.currentTurn = chess.turn() === 'w' ? 'white' : 'black';
          
          this.roomCache.set(roomId, room);
          
          this.io.to(roomId).emit('move_made', {
            move,
            fen: room.gameData.fen,
            pgn: room.gameData.pgn,
            currentTurn: room.currentTurn,
            isAIMove: true
          });
          
          setImmediate(async () => {
            try {
              await room.save();
            } catch (error) {
              console.error('Error saving random AI move:', error);
            }
          });
        }
      }
    } catch (error) {
      console.error('Make AI move error:', error);
    }
  }

  // CRITICAL FIX: Use elapsed time instead of fixed 1-second decrement
  startGameTimer(roomId) {
    // Don't start multiple timers for the same room
    if (this.roomTimers.has(roomId)) {
      return; // Timer already running
    }
    
    let lastTick = Date.now();
    
    const timer = setInterval(async () => {
      let room = this.roomCache.get(roomId);
      
      if (!room) {
        room = await Room.findOne({ roomId });
        if (room) {
          this.roomCache.set(roomId, room);
        } else {
          this.clearGameTimer(roomId);
          return;
        }
      }
      
      if (!room || room.gameStatus !== 'in_progress' || room.timeControl === -1) {
        this.clearGameTimer(roomId);
        return;
      }
      
      // CRITICAL FIX: Calculate actual elapsed time instead of assuming 1 second
      const now = Date.now();
      const elapsed = Math.floor((now - lastTick) / 1000);
      lastTick = now;
      
      // Only update if at least 1 second has passed
      if (elapsed < 1) return;
      
      // Decrease time for current player
      const currentPlayer = room.currentTurn === 'white' ? 
        (room.player1.color === 'white' ? 'player1' : 'player2') :
        (room.player1.color === 'black' ? 'player1' : 'player2');
      
      if (room[currentPlayer].timeLeft > 0) {
        room[currentPlayer].timeLeft -= elapsed; // Subtract actual elapsed time
        
        // Ensure we don't go negative
        if (room[currentPlayer].timeLeft < 0) {
          room[currentPlayer].timeLeft = 0;
        }
      }
      
      // Check for timeout
      if (room[currentPlayer].timeLeft <= 0) {
        const winner = room.currentTurn === 'white' ? 'black' : 'white';
        await this.endGame(room, { winner, reason: 'timeout' });
        
        this.io.to(roomId).emit('game_ended', {
          result: { winner, reason: 'timeout' },
          message: `${room.currentTurn} ran out of time`
        });
        
        this.clearGameTimer(roomId);
        return;
      }
      
      // Update cache
      this.roomCache.set(roomId, room);
      
      // Emit time update
      this.io.to(roomId).emit('time_update', {
        player1TimeLeft: room.player1.timeLeft,
        player2TimeLeft: room.player2.timeLeft
      });
      
      // Save to database every 10 seconds to reduce DB load
      if (room[currentPlayer].timeLeft % 10 === 0) {
        setImmediate(async () => {
          try {
            await room.save();
          } catch (error) {
            console.error('Error saving timer update:', error);
          }
        });
      }
    }, 1000);
    
    this.roomTimers.set(roomId, { timer, lastTick });
  }

  clearGameTimer(roomId) {
    if (this.roomTimers.has(roomId)) {
      clearInterval(this.roomTimers.get(roomId).timer);
      this.roomTimers.delete(roomId);
    }
  }

  // FIXED: Check all draw conditions including 50-move rule
  getGameResult(chess) {
    if (chess.isCheckmate()) {
      return {
        winner: chess.turn() === 'w' ? 'black' : 'white',
        reason: 'checkmate'
      };
    } else if (chess.isStalemate()) {
      return { winner: 'draw', reason: 'stalemate' };
    } else if (chess.isInsufficientMaterial()) {
      return { winner: 'draw', reason: 'insufficient_material' };
    } else if (chess.isThreefoldRepetition()) {
      return { winner: 'draw', reason: 'threefold_repetition' };
    } else if (chess.isDraw()) {
      // This catches 50-move rule and other draw conditions
      return { winner: 'draw', reason: 'fifty_move_rule' };
    }
    return { winner: 'draw', reason: 'stalemate' };
  }

  async endGame(room, result) {
    room.result = result;
    room.gameStatus = 'finished';
    
    // Update cache
    this.roomCache.set(room.roomId, room);
    
    this.clearGameTimer(room.roomId);
    
    // Clean up user room mappings
    if (room.player1.userId) {
      this.userRooms.delete(room.player1.userId.toString());
    }
    if (room.player2.userId) {
      this.userRooms.delete(room.player2.userId.toString());
    }
    
    // Save to database
    await room.save();
    
    // Update ratings and create match history for rated games
    if (room.matchType === 'rated' && room.player1.userId && room.player2.userId) {
      await this.updateRatingsAndHistory(room);
    } else if (room.matchType === 'ai' && room.player1.userId) {
      // Create match history for AI games (no rating change)
      await this.createMatchHistory(room, room.player1.userId, null, result);
    }
  }

  async updateRatingsAndHistory(room) {
    const player1 = await User.findById(room.player1.userId);
    const player2 = await User.findById(room.player2.userId);
    
    if (!player1 || !player2) return;
    
    const { result } = room;
    let player1Result, player2Result;
    
    if (result.winner === 'draw') {
      player1Result = player2Result = 0.5;
    } else if (result.winner === room.player1.color) {
      player1Result = 1;
      player2Result = 0;
    } else {
      player1Result = 0;
      player2Result = 1;
    }
    
    // Calculate rating changes
    const player1K = getKFactor(player1.rating, player1.gamesPlayed);
    const player2K = getKFactor(player2.rating, player2.gamesPlayed);
    
    const player1Change = calculateRatingChange(player1.rating, player2.rating, player1Result, player1K);
    const player2Change = calculateRatingChange(player2.rating, player1.rating, player2Result, player2K);
    
    // Update ratings
    player1.rating += player1Change;
    player2.rating += player2Change;
    
    // Update game statistics
    player1.gamesPlayed++;
    player2.gamesPlayed++;
    
    if (player1Result === 1) {
      player1.wins++;
      player2.losses++;
    } else if (player2Result === 1) {
      player2.wins++;
      player1.losses++;
    } else {
      player1.draws++;
      player2.draws++;
    }
    
    await player1.save();
    await player2.save();
    
    // Create match history
    await this.createMatchHistory(room, player1._id, player2._id, result, player1.rating - player1Change, player1.rating, player1Change);
    await this.createMatchHistory(room, player2._id, player1._id, result, player2.rating - player2Change, player2.rating, player2Change);
  }

  async createMatchHistory(room, userId, opponentId, result, ratingBefore, ratingAfter, ratingChange) {
    // Determine user's color - handle both userId and guestId
    let userColor;
    const userIdStr = userId?.toString();
    
    if (room.player1.userId?.toString() === userIdStr || room.player1.userId?._id?.toString() === userIdStr) {
      userColor = room.player1.color;
    } else if (room.player2.userId?.toString() === userIdStr || room.player2.userId?._id?.toString() === userIdStr) {
      userColor = room.player2.color;
    } else {
      // Fallback for AI games or edge cases
      userColor = room.player1.color;
    }
    
    let userResult;
    if (result.winner === 'draw') {
      userResult = 'draw';
    } else if (result.winner === userColor) {
      userResult = 'win';
    } else {
      userResult = 'loss';
    }
    
    // Build detailed moves array for replay
    // We need to replay the game to get FEN after each move and SAN notation
    const { Chess } = await import('chess.js');
    const chess = new Chess();
    const detailedMoves = [];
    
    // If we have the moves array from room, use it
    if (room.gameData.moves && room.gameData.moves.length > 0) {
      for (let i = 0; i < room.gameData.moves.length; i++) {
        const move = room.gameData.moves[i];
        try {
          const result = chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
          if (result) {
            detailedMoves.push({
              from: move.from,
              to: move.to,
              piece: result.piece,
              san: result.san,
              fen: chess.fen(),
              timestamp: move.timestamp,
              timeLeft: move.timeLeft,
              moveNumber: Math.floor(i / 2) + 1
            });
          }
        } catch (e) {
          // If move fails, skip it
          console.error('Error replaying move for history:', e);
        }
      }
    }
    
    const matchHistory = new MatchHistory({
      userId,
      opponentId,
      roomId: room.roomId,
      result: userResult,
      userColor,
      matchType: room.matchType,
      timeControl: room.timeControl,
      ratingBefore: ratingBefore || 0,
      ratingAfter: ratingAfter || ratingBefore || 0,
      ratingChange: ratingChange || 0,
      gameData: {
        pgn: room.gameData.pgn,
        finalFen: room.gameData.fen,
        startingFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moveCount: room.gameData.moves.length,
        gameDuration: Math.floor((new Date() - room.createdAt) / 1000),
        moves: detailedMoves
      },
      endReason: result.reason
    });
    
    await matchHistory.save();
  }

  getPlayerColor(room, oderId) {
    // Handle ObjectId comparison properly
    const odStr = oderId?.toString ? oderId.toString() : oderId;
    
    if (room.player1.userId) {
      const p1Id = room.player1.userId._id?.toString() || room.player1.userId.toString();
      if (p1Id === odStr) {
        return room.player1.color;
      }
    }
    if (room.player2.userId) {
      const p2Id = room.player2.userId._id?.toString() || room.player2.userId.toString();
      if (p2Id === odStr) {
        return room.player2.color;
      }
    }
    // For guest users, check by socket ID
    if (room.player1.guestId === odStr) {
      return room.player1.color;
    }
    if (room.player2.guestId === odStr) {
      return room.player2.color;
    }
    return null;
  }

  getPlayerTimeLeft(room, oderId) {
    const odStr = oderId?.toString ? oderId.toString() : oderId;
    
    if (room.player1.userId) {
      const p1Id = room.player1.userId._id?.toString() || room.player1.userId.toString();
      if (p1Id === odStr) {
        return room.player1.timeLeft;
      }
    }
    if (room.player2.userId) {
      const p2Id = room.player2.userId._id?.toString() || room.player2.userId.toString();
      if (p2Id === odStr) {
        return room.player2.timeLeft;
      }
    }
    // For guest users
    if (room.player1.guestId === odStr) {
      return room.player1.timeLeft;
    }
    if (room.player2.guestId === odStr) {
      return room.player2.timeLeft;
    }
    return null;
  }

  formatUser(user) {
    return {
      id: user._id,
      username: user.username,
      rating: user.rating,
      gamesPlayed: user.gamesPlayed,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      isOnline: user.isOnline
    };
  }

  formatRoom(room) {
    return {
      roomId: room.roomId,
      player1: room.player1,
      player2: room.player2,
      gameStatus: room.gameStatus,
      currentTurn: room.currentTurn,
      timeControl: room.timeControl,
      matchType: room.matchType,
      gameData: room.gameData,
      result: room.result,
      isPrivate: room.isPrivate,
      aiLevel: room.aiLevel
    };
  }
}

export default SocketService;