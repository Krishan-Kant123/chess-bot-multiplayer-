// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { useSocket } from '../../contexts/SocketContext';
// import { useAuth } from '../../contexts/AuthContext';
// import { ChessBoard } from './ChessBoard';
// import { GameInfo } from './GameInfo';
// import { GameChat } from './GameChat';
// import { motion } from 'framer-motion';
// import { Clock, Users, Flag, Handshake, MessageCircle } from 'lucide-react';

// interface Player {
//   userId: any;
//   guestId?: string;
//   guestUsername?: string;
//   color: 'white' | 'black';
//   timeLeft: number;
//   isReady: boolean;
// }

// interface Room {
//   roomId: string;
//   player1: Player;
//   player2: Player;
//   gameStatus: 'waiting' | 'in_progress' | 'paused' | 'finished' | 'abandoned';
//   currentTurn: 'white' | 'black';
//   timeControl: number;
//   matchType: 'casual' | 'rated' | 'ai';
//   gameData: {
//     fen: string;
//     pgn: string;
//     moves: any[];
//   };
//   result?: {
//     winner: 'white' | 'black' | 'draw' | null;
//     reason: string;
//   };
//   isPrivate: boolean;
//   aiLevel?: number;
// }

// export const GameRoom: React.FC = () => {
//   const { roomId } = useParams<{ roomId: string }>();
//   const { socket } = useSocket();
//   const { user } = useAuth();
//   const navigate = useNavigate();

//   const [room, setRoom] = useState<Room | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [drawOffered, setDrawOffered] = useState(false);
//   const [drawOfferFrom, setDrawOfferFrom] = useState('');
//   const [showChat, setShowChat] = useState(false);

//   useEffect(() => {
//     if (!socket || !roomId) return;

//     socket.emit('join_room', { roomId });

//     const handleRoomUpdate = (data: any) => {
//       // Add short delay to prevent instant same-player glitch
//       setLoading(true);
//       setTimeout(() => {
//         setRoom(data.room);
//         setLoading(false);
//       }, 400);
//     };

//     socket.on('room_update', handleRoomUpdate);

//     socket.on('move_made', (data) => {
//       setRoom((prev) =>
//         prev
//           ? {
//               ...prev,
//               gameData: {
//                 ...prev.gameData,
//                 fen: data.fen,
//                 pgn: data.pgn,
//               },
//               currentTurn: data.currentTurn,
//               gameStatus: data.gameStatus,
//             }
//           : null
//       );
//     });

//     socket.on('time_update', (data) => {
//       setRoom((prev) =>
//         prev
//           ? {
//               ...prev,
//               player1: { ...prev.player1, timeLeft: data.player1TimeLeft },
//               player2: { ...prev.player2, timeLeft: data.player2TimeLeft },
//             }
//           : null
//       );
//     });

//     socket.on('game_ended', (data) => {
//       setRoom((prev) =>
//         prev
//           ? {
//               ...prev,
//               result: data.result,
//               gameStatus: 'finished',
//             }
//           : null
//       );
//       alert(data.message);
//     });

//     socket.on('draw_offered', (data) => {
//       setDrawOffered(true);
//       setDrawOfferFrom(data.username || 'Opponent');
//     });

//     socket.on('draw_declined', () => {
//       alert('Draw offer declined');
//       setDrawOffered(false);
//     });

//     socket.on('error', (data) => setError(data.message));
//     socket.on('invalid_move', (data) => alert(data.message));

//     return () => {
//       socket.off('room_update', handleRoomUpdate);
//       socket.off('move_made');
//       socket.off('time_update');
//       socket.off('game_ended');
//       socket.off('draw_offered');
//       socket.off('draw_declined');
//       socket.off('error');
//       socket.off('invalid_move');
//     };
//   }, [socket, roomId]);

//   const handleMove = (move: { from: string; to: string; promotion?: string }) => {
//     if (!socket || !room) return;
//     socket.emit('make_move', { roomId, move });
//   };

//   const handleResign = () => {
//     if (!socket || !room) return;
//     if (window.confirm('Are you sure you want to resign?')) {
//       socket.emit('resign', { roomId });
//     }
//   };

//   const handleOfferDraw = () => {
//     if (!socket || !room) return;
//     socket.emit('offer_draw', { roomId });
//     alert('Draw offer sent');
//   };

//   const handleDrawResponse = (accept: boolean) => {
//     if (!socket || !room) return;
//     socket.emit('draw_response', { roomId, accept });
//     setDrawOffered(false);
//   };

//   // const getUserColor = (): 'white' | 'black' => {
//   //   if (!room || !user) return 'white';
//   //   if (room.player1.userId?._id === user.id || room.player1.guestId === user.id)
//   //     return room.player1.color;
//   //   else if (room.player2.userId?._id === user.id || room.player2.guestId === user.id)
//   //     return room.player2.color;
//   //   return 'white';
//   // };
//   const getUserColor = (): 'white' | 'black' => {
//   if (!room || !user) return 'white';

//   const userId = user?._id || user.id;
// // console.log('User ID:', userId);

// // console.log(userId, room.player1.userId, room.player2.userId);
// // console.log(room.player1)
//   if (String(room.player1.userId) === String(userId) || room.player1.guestId === userId) {
//     return room.player1.color;
//   } else if (String(room.player2.userId) === String(userId) || room.player2.guestId === userId) {
//     return room.player2.color;
//   }
//   return 'white';
// };


//   const getPlayerName = (player: Player): string => {
//     if (player.guestUsername) return player.guestUsername;
//     if (player.userId?.username) return player.userId.username;
//     return 'Waiting...';
//   };

//   const getPlayerRating = (player: Player): number | null => {
//     if (player.guestUsername) return null;
//     return player.userId?.rating || null;
//   };

//   const formatTime = (seconds: number): string => {
//     if (seconds === -1) return '∞';
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   // 🔄 Display nice loader until both room and user are ready
//   if (loading || !room || !user) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
//         <div className="text-center animate-fade-in">
//           <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-purple-200">Preparing your game...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-red-900 flex items-center justify-center">
//         <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-lg text-center border border-white/20">
//           <p className="text-red-200 mb-4">{error || 'Room not found'}</p>
//           <button
//             onClick={() => navigate('/')}
//             className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
//           >
//             Back to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   const userColor = getUserColor();
//   const userId = user?.id;

// const isPlayer1 =
//   String(room.player1.userId) === String(userId) ||
//   room.player1.guestId === userId;

// const currentPlayer = isPlayer1 ? room.player1 : room.player2;
// const opponent = isPlayer1 ? room.player2 : room.player1;


//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
//       <div className="max-w-7xl mx-auto">
//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//           {/* Game Board */}
//           <div className="lg:col-span-3 flex flex-col items-center">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ duration: 0.6 }}
//               className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-6 mb-6 border border-white/20"
//             >
//               {/* Opponent Info */}
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center">
//                   <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
//                     <Users className="w-5 h-5 text-white" />
//                   </div>
//                   <div>
//                     <span className="font-medium text-white">
//                       {room.matchType === 'ai'
//                         ? 'AI Bot'
//                         : getPlayerName(opponent)}
//                     </span>
//                     {getPlayerRating(opponent) && (
//                       <span className="ml-2 text-purple-300">
//                         ({getPlayerRating(opponent)})
//                       </span>
//                     )}
//                   </div>
//                 </div>
//                 <div className="flex items-center bg-black/30 rounded-lg px-3 py-2">
//                   <Clock className="w-5 h-5 text-purple-300 mr-2" />
//                   <span
//                     className={`font-mono text-lg ${
//                       room.currentTurn !== userColor
//                         ? 'text-red-400 font-bold animate-pulse'
//                         : 'text-purple-200'
//                     }`}
//                   >
//                     {formatTime(opponent.timeLeft)}
//                   </span>
//                 </div>
//               </div>

//               {/* Chess Board */}
//               <div className="flex justify-center mb-4">
//                 <ChessBoard
//                   fen={room.gameData.fen}
//                   orientation={userColor}
//                   onMove={handleMove}
//                   currentTurn={room.currentTurn}
//                   userColor={userColor}
//                   disabled={room.gameStatus !== 'in_progress'}
//                 />
//               </div>

//               {/* Current Player Info */}
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center">
//                   <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3">
//                     <Users className="w-5 h-5 text-white" />
//                   </div>
//                   <div>
//                     <span className="font-medium text-white">
//                       {user?.username || 'You'}
//                     </span>
//                     {user?.rating && (
//                       <span className="ml-2 text-blue-300">
//                         ({user.rating})
//                       </span>
//                     )}
//                   </div>
//                 </div>
//                 <div className="flex items-center bg-black/30 rounded-lg px-3 py-2">
//                   <Clock className="w-5 h-5 text-blue-300 mr-2" />
//                   <span
//                     className={`font-mono text-lg ${
//                       room.currentTurn === userColor
//                         ? 'text-red-400 font-bold animate-pulse'
//                         : 'text-blue-200'
//                     }`}
//                   >
//                     {formatTime(currentPlayer.timeLeft)}
//                   </span>
//                 </div>
//               </div>
//             </motion.div>

//             {/* Game Controls */}
//             {room.gameStatus === 'in_progress' && (
//               <div className="flex flex-wrap gap-3">
//                 {room.matchType !== 'ai' && (
//                   <>
//                     <button
//                       onClick={handleOfferDraw}
//                       className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-200 px-4 py-2 rounded-lg flex items-center transition-all duration-200 backdrop-blur-sm"
//                     >
//                       <Handshake className="w-4 h-4 mr-2" />
//                       Offer Draw
//                     </button>
//                     <button
//                       onClick={() => setShowChat(!showChat)}
//                       className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-200 px-4 py-2 rounded-lg flex items-center transition-all duration-200 backdrop-blur-sm"
//                     >
//                       <MessageCircle className="w-4 h-4 mr-2" />
//                       Chat
//                     </button>
//                   </>
//                 )}
//                 <button
//                   onClick={handleResign}
//                   className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg flex items-center transition-all duration-200 backdrop-blur-sm"
//                 >
//                   <Flag className="w-4 h-4 mr-2" />
//                   Resign
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Sidebar */}
//           <div className="lg:col-span-1 space-y-6">
//             <GameInfo room={room} />
//             {showChat && room.matchType !== 'ai' && (
//               <GameChat roomId={roomId!} />
//             )}
//           </div>
//         </div>

//         {/* Draw Offer Modal */}
//         {drawOffered && (
//           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
//             <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/20 max-w-md w-full mx-4">
//               <h3 className="text-lg font-bold mb-4 text-white">Draw Offer</h3>
//               <p className="mb-6 text-purple-200">
//                 {drawOfferFrom} is offering a draw. Do you accept?
//               </p>
//               <div className="flex space-x-4">
//                 <button
//                   onClick={() => handleDrawResponse(true)}
//                   className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-200 px-4 py-2 rounded-lg transition-all duration-200"
//                 >
//                   Accept
//                 </button>
//                 <button
//                   onClick={() => handleDrawResponse(false)}
//                   className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg transition-all duration-200"
//                 >
//                   Decline
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };




import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChessBoard } from './ChessBoard';
import { GameInfo } from './GameInfo';
import { GameChat } from './GameChat';
import { motion } from 'framer-motion';
import { Clock, Users, Flag, Handshake, MessageCircle } from 'lucide-react';

interface Player {
  userId: any;
  guestId?: string;
  guestUsername?: string;
  color: 'white' | 'black';
  timeLeft: number;
  isReady: boolean;
}

interface Room {
  roomId: string;
  player1: Player;
  player2: Player;
  gameStatus: 'waiting' | 'in_progress' | 'paused' | 'finished' | 'abandoned';
  currentTurn: 'white' | 'black';
  timeControl: number;
  matchType: 'casual' | 'rated' | 'ai';
  gameData: {
    fen: string;
    pgn: string;
    moves: any[];
  };
  result?: {
    winner: 'white' | 'black' | 'draw' | null;
    reason: string;
  };
  isPrivate: boolean;
  aiLevel?: number;
}

export const GameRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawOffered, setDrawOffered] = useState(false);
  const [drawOfferFrom, setDrawOfferFrom] = useState('');
  const [showChat, setShowChat] = useState(false);

  // ---------------------- SOCKET LISTENERS ----------------------
  useEffect(() => {
    if (!socket || !roomId) return;

    const joinRoom = () => socket.emit('join_room', { roomId });
    joinRoom(); // join initially

    // Auto re-join on reconnect
    socket.on('connect', () => {
      console.log('Socket reconnected, rejoining room');
      joinRoom();
    });

    // Room update
    const handleRoomUpdate = (data: any) =>{
      setRoom(data.room);
       setLoading(true);
      setTimeout(() => {
        setRoom(data.room);
        setLoading(false);
      }, 400);
    } ;
    
    socket.on('room_update', handleRoomUpdate);

    socket.on('move_made', (data) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              gameData: { ...prev.gameData, fen: data.fen, pgn: data.pgn },
              currentTurn: data.currentTurn,
              gameStatus: data.gameStatus,
            }
          : null
      );
    });

    socket.on('time_update', (data) => {
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              player1: { ...prev.player1, timeLeft: data.player1TimeLeft },
              player2: { ...prev.player2, timeLeft: data.player2TimeLeft },
            }
          : null
      );
    });

    socket.on('game_ended', (data) => {
      setRoom((prev) =>
        prev
          ? { ...prev, result: data.result, gameStatus: 'finished' }
          : null
      );
      alert(data.message);
    });

    socket.on('draw_offered', (data) => {
      setDrawOffered(true);
      setDrawOfferFrom(data.username || 'Opponent');
    });

    socket.on('draw_declined', () => {
      alert('Draw offer declined');
      setDrawOffered(false);
    });

    socket.on('error', (data) => setError(data.message));
    socket.on('invalid_move', (data) => alert(data.message));

    // Handle mobile tab/browser visibility
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') joinRoom();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      socket.off('room_update', handleRoomUpdate);
      socket.off('connect');
      socket.off('move_made');
      socket.off('time_update');
      socket.off('game_ended');
      socket.off('draw_offered');
      socket.off('draw_declined');
      socket.off('error');
      socket.off('invalid_move');
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [socket, roomId]);

  // ---------------------- USER ACTIONS ----------------------
  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (!socket || !room) return;
    socket.emit('make_move', { roomId, move });
  };

  const handleResign = () => {
    if (!socket || !room) return;
    if (window.confirm('Are you sure you want to resign?')) {
      socket.emit('resign', { roomId });
    }
  };

  const handleOfferDraw = () => {
    if (!socket || !room) return;
    socket.emit('offer_draw', { roomId });
    alert('Draw offer sent');
  };

  const handleDrawResponse = (accept: boolean) => {
    if (!socket || !room) return;
    socket.emit('draw_response', { roomId, accept });
    setDrawOffered(false);
  };

  // ---------------------- HELPER FUNCTIONS ----------------------
  const getUserColor = (): 'white' | 'black' => {
    if (!room || !user) return 'white';
    const userId = user?._id || user.id;
    if (String(room.player1.userId) === String(userId) || room.player1.guestId === userId) return room.player1.color;
    if (String(room.player2.userId) === String(userId) || room.player2.guestId === userId) return room.player2.color;
    return 'white';
  };

  const getPlayerName = (player: Player): string => {
    if (player.guestUsername) return player.guestUsername;
    if (player.userId?.username) return player.userId.username;
    return 'Waiting...';
  };

  const getPlayerRating = (player: Player): number | null => {
    if (player.guestUsername) return null;
    return player.userId?.rating || null;
  };

  const formatTime = (seconds: number): string => {
    if (seconds === -1) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !room || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-200">Preparing your game...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-red-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-lg text-center border border-white/20">
          <p className="text-red-200 mb-4">{error || 'Room not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const userColor = getUserColor();
  const userId = user?.id;
  const isPlayer1 = String(room.player1.userId) === String(userId) || room.player1.guestId === userId;
  const currentPlayer = isPlayer1 ? room.player1 : room.player2;
  const opponent = isPlayer1 ? room.player2 : room.player1;

  // ---------------------- MAIN RENDER ----------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Board */}
          <div className="lg:col-span-3 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-6 mb-6 border border-white/20"
            >
              {/* Opponent Info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-white">{room.matchType === 'ai' ? 'AI Bot' : getPlayerName(opponent)}</span>
                    {getPlayerRating(opponent) && <span className="ml-2 text-purple-300">({getPlayerRating(opponent)})</span>}
                  </div>
                </div>
                <div className="flex items-center bg-black/30 rounded-lg px-3 py-2">
                  <Clock className="w-5 h-5 text-purple-300 mr-2" />
                  <span className={`font-mono text-lg ${room.currentTurn !== userColor ? 'text-red-400 font-bold animate-pulse' : 'text-purple-200'}`}>
                    {formatTime(opponent.timeLeft)}
                  </span>
                </div>
              </div>

              {/* Chess Board */}
              <div className="flex justify-center mb-4">
                <ChessBoard
                  fen={room.gameData.fen}
                  orientation={userColor}
                  onMove={handleMove}
                  currentTurn={room.currentTurn}
                  userColor={userColor}
                  disabled={room.gameStatus !== 'in_progress'}
                />
              </div>

              {/* Current Player Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-medium text-white">{user?.username || 'You'}</span>
                    {user?.rating && <span className="ml-2 text-blue-300">({user.rating})</span>}
                  </div>
                </div>
                <div className="flex items-center bg-black/30 rounded-lg px-3 py-2">
                  <Clock className="w-5 h-5 text-blue-300 mr-2" />
                  <span className={`font-mono text-lg ${room.currentTurn === userColor ? 'text-red-400 font-bold animate-pulse' : 'text-blue-200'}`}>
                    {formatTime(currentPlayer.timeLeft)}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Game Controls */}
            {room.gameStatus === 'in_progress' && (
              <div className="flex flex-wrap gap-3">
                {room.matchType !== 'ai' && (
                  <>
                    <button onClick={handleOfferDraw} className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 text-yellow-200 px-4 py-2 rounded-lg flex items-center transition-all duration-200 backdrop-blur-sm">
                      <Handshake className="w-4 h-4 mr-2" />
                      Offer Draw
                    </button>
                    <button onClick={() => setShowChat(!showChat)} className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-200 px-4 py-2 rounded-lg flex items-center transition-all duration-200 backdrop-blur-sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Chat
                    </button>
                  </>
                )}
                <button onClick={handleResign} className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg flex items-center transition-all duration-200">
                  <Flag className="w-4 h-4 mr-2" />
                  Resign
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <GameInfo room={room} />
            {showChat && room.matchType !== 'ai' && <GameChat roomId={roomId!} />}
          </div>
        </div>

        {/* Draw Offer Modal */}
        {drawOffered && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg border border-white/20 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4 text-white">Draw Offer</h3>
              <p className="mb-6 text-purple-200">{drawOfferFrom} is offering a draw. Do you accept?</p>
              <div className="flex space-x-4">
                <button onClick={() => handleDrawResponse(true)} className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-200 px-4 py-2 rounded-lg transition-all duration-200">Accept</button>
                <button onClick={() => handleDrawResponse(false)} className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg transition-all duration-200">Decline</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

