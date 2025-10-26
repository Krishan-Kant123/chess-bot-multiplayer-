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
    this.connectedUsers = new Map();
    this.roomTimers = new Map();
    this.roomCache = new Map(); // Cache rooms for better performance
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
      } else {
        socket.emit('authentication_error', { message: 'Invalid token' });
      }
    });

    // Guest authentication
    socket.on('authenticate_guest', async (data) => {
      const { username } = data;
      console.log("guest auth", username)
      if (!username || username.trim().length < 2) {
        socket.emit('authentication_error', { message: 'Username must be at least 2 characters' });
        return;
      }
      
      socket.guestUsername = username.trim();
      socket.isGuest = true;
      socket.emit('authenticated', { 
        user: { 
          id: socket.id, 
          username: socket.guestUsername, 
          rating: 600, 
          isGuest: true 
        } 
      });
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
      
      // Emit to room immediately without database query
      this.io.to(roomId).emit('room_update', { room: this.formatRoom(room) });
      
      // Start game timer if game is in progress
      if (room.gameStatus === 'in_progress' && room.timeControl > 0) {
        this.startGameTimer(roomId);
      }
    });

    // Make move - optimized for speed
    socket.on('make_move', async (data) => {
      if (!socket.userId && !socket.isGuest) return;
      
      const { roomId, move } = data;
      let room = this.roomCache.get(roomId);
      
      if (!room) {
        room = await Room.findOne({ roomId }).populate('player1.userId player2.userId', 'username rating');
        if (room) {
          this.roomCache.set(roomId, room);
        }
      }
      
      if (!room) return;
      
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
          timeLeft: this.getPlayerTimeLeft(room, socket.userId || socket.id)
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
        
        // Check for game end
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

    // Join matchmaking queue
    socket.on('join_queue', async (data) => {
      if (!socket.userId) return; // Only authenticated users can join rated queues
      console.log("join queue", data)
      
      const { matchType, timeControl, preferredColor } = data;
      const user = await User.findById(socket.userId);
      
      // Remove from existing queue
      await Queue.deleteMany({ userId: socket.userId });
      
      // Add to queue
      const queueEntry = new Queue({
        userId: socket.userId,
        matchType,
        timeControl,
        rating: user.rating,
        preferredColor: preferredColor || 'random',
        socketId: socket.id
      });
      
      await queueEntry.save();
      
      // Try to find a match immediately
      const match = await this.findMatch(queueEntry);
      if (match) {
        await this.createMatchFromQueue(match.player1, match.player2);
      }
      
      socket.emit('queue_joined', { message: 'Searching for opponent...' });
    });

    // Leave queue
    socket.on('leave_queue', async () => {
      if (!socket.userId) return;
      
      await Queue.deleteMany({ userId: socket.userId });
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
      
      const resigningPlayer = this.getPlayerColor(room, socket.userId || socket.id);
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
      socket.to(roomId).emit('draw_offered', { from: socket.userId || socket.id, username });
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

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('Socket disconnected:', socket.id);
      
      if (socket.userId) {
        const user = await User.findById(socket.userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          await user.save();
        }
        
        // Remove from queue
        await Queue.deleteMany({ socketId: socket.id });
        
        this.connectedUsers.delete(socket.id);
      }
      
      // Clear room timer if needed
      if (socket.currentRoom) {
        this.clearGameTimer(socket.currentRoom);
      }
    });
  }

  async findMatch(queueEntry) {
    const ratingRange = 200; // ±200 rating points
    
    const potentialMatches = await Queue.find({
      userId: { $ne: queueEntry.userId },
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
  
    room.player1.userId = player1Queue.userId;
    room.player1.timeLeft = player1Queue.timeControl === -1 ? -1 : player1Queue.timeControl;
    room.player1.color = player1IsWhite ? 'white' : 'black';
  
    room.player2.userId = player2Queue.userId;
    room.player2.timeLeft = player2Queue.timeControl === -1 ? -1 : player2Queue.timeControl;
    room.player2.color = player1IsWhite ? 'black' : 'white';
  
    // Sanity check (extra safety)
    if (room.player1.color === room.player2.color) {
      room.player2.color = room.player1.color === 'white' ? 'black' : 'white';
    }
   const u = await User.findById(room.player1.userId);
      const v = await User.findById(room.player2.userId);
      room.player1.guestUsername = u ? u.username : room.player1.guestUsername;
      room.player2.guestUsername = v ? v.username : room.player2.guestUsername;
      // console.log(room)
    await room.save();
    this.roomCache.set(roomId, room);
  
    // Remove both from queue
    await Queue.deleteMany({
      userId: { $in: [player1Queue.userId, player2Queue.userId] }
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
      
      try {
        const aiResponse = await StockfishAPI.getBestMove(room.gameData.fen, room.aiLevel);
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

  startGameTimer(roomId) {
    if (this.roomTimers.has(roomId)) {
      clearInterval(this.roomTimers.get(roomId));
    }
    
    const timer = setInterval(async () => {
      let room = this.roomCache.get(roomId);
      
      if (!room) {
        room = await Room.findOne({ roomId });
        if (room) {
          this.roomCache.set(roomId, room);
        }
      }
      
      if (!room || room.gameStatus !== 'in_progress' || room.timeControl === -1) {
        this.clearGameTimer(roomId);
        return;
      }
      
      // Decrease time for current player
      const currentPlayer = room.currentTurn === 'white' ? 
        (room.player1.color === 'white' ? 'player1' : 'player2') :
        (room.player1.color === 'black' ? 'player1' : 'player2');
      
      if (room[currentPlayer].timeLeft > 0) {
        room[currentPlayer].timeLeft -= 1;
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
    
    this.roomTimers.set(roomId, timer);
  }

  clearGameTimer(roomId) {
    if (this.roomTimers.has(roomId)) {
      clearInterval(this.roomTimers.get(roomId));
      this.roomTimers.delete(roomId);
    }
  }

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
    }
    return { winner: 'draw', reason: 'stalemate' };
  }

  async endGame(room, result) {
    room.result = result;
    room.gameStatus = 'finished';
    
    // Update cache
    this.roomCache.set(room.roomId, room);
    
    this.clearGameTimer(room.roomId);
    
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
    const userColor = room.player1.userId.toString() === userId.toString() ? room.player1.color : room.player2.color;
    
    let userResult;
    if (result.winner === 'draw') {
      userResult = 'draw';
    } else if (result.winner === userColor) {
      userResult = 'win';
    } else {
      userResult = 'loss';
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
        moveCount: room.gameData.moves.length,
        gameDuration: Math.floor((new Date() - room.createdAt) / 1000)
      },
      endReason: result.reason
    });
    
    await matchHistory.save();
  }

  getPlayerColor(room, userId) {
    if (room.player1.userId && room.player1.userId._id.toString() === userId.toString()) {
      return room.player1.color;
    }
    if (room.player2.userId && room.player2.userId._id.toString() === userId.toString()) {
      return room.player2.color;
    }
    // For guest users, check by socket ID
    if (room.player1.guestId === userId) {
      return room.player1.color;
    }
    if (room.player2.guestId === userId) {
      return room.player2.color;
    }
    return null;
  }

  getPlayerTimeLeft(room, userId) {
    if (room.player1.userId && room.player1.userId._id.toString() === userId.toString()) {
      return room.player1.timeLeft;
    }
    if (room.player2.userId && room.player2.userId._id.toString() === userId.toString()) {
      return room.player2.timeLeft;
    }
    // For guest users
    if (room.player1.guestId === userId) {
      return room.player1.timeLeft;
    }
    if (room.player2.guestId === userId) {
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