# Chess Application with Authentication

A full-featured chess application built with the MERN stack, featuring real-time gameplay, user authentication, rating system, and AI opponents.

## Features

### Core Features
- **User Authentication**: Secure registration and login system
- **Real-time Chess Gameplay**: Live games using Socket.io
- **Rating System**: ELO-based rating system with default 600 rating for new users
- **Time Controls**: Multiple time formats (Blitz, Rapid, Classical, Unlimited)
- **Room-based Games**: Fixed player assignments per room
- **Match Types**: Casual, Rated, and AI games
- **Random Matchmaking**: Queue system matching players by time control and match type
- **AI Integration**: Play against Stockfish AI with multiple difficulty levels
- **Match History**: Complete game history with statistics
- **Real-time Game Status**: Live updates on game state and player turns

### Technical Features
- **MERN Stack**: MongoDB, Express.js, React, Node.js
- **Real-time Communication**: Socket.io for live gameplay
- **Chess Logic**: chess.js library for move validation
- **External AI**: Stockfish API integration
- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Clean, intuitive interface with Tailwind CSS

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your configuration:
   ```
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chessapp
   JWT_SECRET=your-super-secret-jwt-key-here
   CLIENT_URL=http://localhost:5173
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Install dependencies in the root directory:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Database Schema

### Users Collection
- `username`: Unique username
- `email`: User email address
- `password`: Hashed password
- `rating`: Current ELO rating (default: 600)
- `gamesPlayed`: Total games played
- `wins`: Number of wins
- `losses`: Number of losses
- `draws`: Number of draws
- `isOnline`: Current online status
- `lastSeen`: Last activity timestamp

### Rooms Collection
- `roomId`: Unique room identifier
- `player1/player2`: Player data including userId, color, timeLeft, isReady
- `gameStatus`: Current game state (waiting, in_progress, finished, etc.)
- `currentTurn`: Which color's turn (white/black)
- `timeControl`: Time limit in seconds (-1 for unlimited)
- `matchType`: Game type (casual, rated, ai)
- `gameData`: FEN position, PGN, move history
- `result`: Game outcome and reason
- `aiLevel`: AI difficulty (for AI games)

### MatchHistory Collection
- `userId`: Player reference
- `opponentId`: Opponent reference (null for AI games)
- `result`: Game outcome (win, loss, draw)
- `userColor`: Color played by user
- `matchType`: Type of match
- `ratingBefore/After`: Rating changes
- `gameData`: Game statistics
- `endReason`: How the game ended

### Queue Collection
- `userId`: Player in queue
- `matchType`: Casual or rated
- `timeControl`: Time format
- `rating`: Player's current rating
- `preferredColor`: Color preference
- `socketId`: Socket connection reference

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### Rooms
- `POST /api/rooms/create` - Create new game room
- `POST /api/rooms/join/:roomId` - Join existing room
- `GET /api/rooms/:roomId` - Get room details
- `GET /api/rooms/history/matches` - Get match history

## Socket Events

### Client to Server
- `authenticate` - Authenticate socket connection
- `join_room` - Join a game room
- `make_move` - Make a chess move
- `join_queue` - Enter matchmaking queue
- `leave_queue` - Exit matchmaking queue
- `resign` - Resign from current game
- `offer_draw` - Offer a draw
- `draw_response` - Accept/decline draw offer

### Server to Client
- `authenticated` - Authentication successful
- `room_update` - Room state changed
- `move_made` - Move executed successfully
- `time_update` - Timer updates
- `game_ended` - Game finished
- `match_found` - Matchmaking successful
- `draw_offered` - Opponent offered draw
- `error` - Error message

## Game Rules & Features

### Rating System
- New users start with 600 rating
- ELO calculation based on opponent strength
- K-factor varies by rating and games played
- Only rated games affect rating

### Time Controls
- **Blitz**: 3 min, 5 min
- **Rapid**: 10 min, 15 min
- **Classical**: 30 min
- **Unlimited**: No time limit

### Match Types
- **Casual**: No rating change, relaxed play
- **Rated**: Rating changes based on result
- **AI**: Practice against computer (no rating impact)

### AI Integration
- **Easy**: Level 3 Stockfish
- **Medium**: Level 8 Stockfish
- **Hard**: Level 15 Stockfish
- Fallback to random moves if API unavailable

## Development

### Project Structure
```
chess-app/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   ├── pages/             # Page components
│   └── App.tsx            # Main app component
├── server/                # Node.js backend
│   ├── models/            # MongoDB models
│   ├── routes/            # Express routes
│   ├── services/          # Business logic
│   ├── middleware/        # Custom middleware
│   └── utils/             # Utility functions
└── README.md
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS, Socket.io Client
- **Backend**: Node.js, Express, Socket.io, MongoDB
- **Chess Engine**: chess.js for game logic
- **AI**: Stockfish Online API
- **Authentication**: JWT tokens
- **Database**: MongoDB with Mongoose ODM

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- chess.js library for chess game logic
- Stockfish for AI chess engine
- Socket.io for real-time communication
- Tailwind CSS for styling
- Lucide React for icons