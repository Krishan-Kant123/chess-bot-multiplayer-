// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSocket } from '../../contexts/SocketContext';
// import { Clock, Users, Bot, Zap, Timer, Infinity } from 'lucide-react';

// interface QueueState {
//   inQueue: boolean;
//   queueType: string;
//   timeControl: number;
// }

// export const PlayMenu: React.FC = () => {
//   const [queueState, setQueueState] = useState<QueueState>({
//     inQueue: false,
//     queueType: '',
//     timeControl: 0
//   });
//   const { socket } = useSocket();
//   const navigate = useNavigate();

//   const timeControls = [
//     { value: 180, label: '3 min', icon: Zap, description: 'Blitz' },
//     { value: 300, label: '5 min', icon: Timer, description: 'Blitz' },
//     { value: 600, label: '10 min', icon: Clock, description: 'Rapid' },
//     { value: 900, label: '15 min', icon: Clock, description: 'Rapid' },
//     { value: 1800, label: '30 min', icon: Clock, description: 'Classical' },
//     { value: -1, label: '∞', icon: Infinity, description: 'Unlimited' },
//   ];

//   const handleQuickMatch = (matchType: 'casual' | 'rated', timeControl: number) => {
//     if (!socket) {
//       alert('Not connected to server');
//       return;
//     }

//     if (queueState.inQueue) {
//       // Leave queue
//       socket.emit('leave_queue');
//       setQueueState({ inQueue: false, queueType: '', timeControl: 0 });
//       return;
//     }

//     // Join queue
//     socket.emit('join_queue', {
//       matchType,
//       timeControl,
//       preferredColor: 'random'
//     });

//     setQueueState({
//       inQueue: true,
//       queueType: matchType,
//       timeControl
//     });

//     // Listen for match found
//     socket.on('match_found', (data) => {
//       setQueueState({ inQueue: false, queueType: '', timeControl: 0 });
//       navigate(`/game/${data.roomId}`);
//     });

//     socket.on('queue_left', () => {
//       setQueueState({ inQueue: false, queueType: '', timeControl: 0 });
//     });
//   };

//   const handleCreateRoom = async (matchType: 'casual' | 'rated' | 'ai', timeControl: number, aiLevel?: number) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:5000/api/rooms/create', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({
//           timeControl,
//           matchType,
//           isPrivate: false,
//           aiLevel
//         })
//       });

//       if (response.ok) {
//         const data = await response.json();
//         navigate(`/game/${data.room.roomId}`);
//       } else {
//         const error = await response.json();
//         alert(error.message || 'Failed to create room');
//       }
//     } catch (error) {
//       console.error('Create room error:', error);
//       alert('Failed to create room');
//     }
//   };

//   return (
//     <div className="max-w-6xl mx-auto">
//       <div className="text-center mb-8">
//         <h2 className="text-3xl font-bold text-white mb-4">Choose Your Game</h2>
//         <p className="text-purple-200">Select a time control and game type to start playing</p>
//       </div>

//       {/* Quick Match Section */}
//       <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-6 mb-8 border border-white/20">
//         <div className="flex items-center mb-6">
//           <Users className="w-6 h-6 text-blue-300 mr-3" />
//           <h3 className="text-xl font-semibold text-white">Quick Match</h3>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {timeControls.map((tc) => {
//             const Icon = tc.icon;
//             return (
//               <div key={tc.value} className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
//                 <div className="flex items-center justify-between mb-3">
//                   <div className="flex items-center">
//                     <Icon className="w-5 h-5 text-purple-300 mr-2" />
//                     <span className="font-semibold text-white text-lg">{tc.label}</span>
//                   </div>
//                   <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full border border-purple-500/30">
//                     {tc.description}
//                   </span>
//                 </div>
                
//                 <div className="space-y-3">
//                   <button
//                     onClick={() => handleQuickMatch('casual', tc.value)}
//                     disabled={queueState.inQueue && (queueState.queueType !== 'casual' || queueState.timeControl !== tc.value)}
//                     className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm ${
//                       queueState.inQueue && queueState.queueType === 'casual' && queueState.timeControl === tc.value
//                         ? 'bg-red-500/80 hover:bg-red-500 text-white border border-red-400'
//                         : 'bg-green-500/80 hover:bg-green-500 text-white disabled:bg-gray-500/50 disabled:cursor-not-allowed border border-green-400 hover:border-green-300'
//                     }`}
//                   >
//                     {queueState.inQueue && queueState.queueType === 'casual' && queueState.timeControl === tc.value
//                       ? 'Cancel Queue'
//                       : 'Casual'}
//                   </button>
                  
//                   <button
//                     onClick={() => handleQuickMatch('rated', tc.value)}
//                     disabled={queueState.inQueue && (queueState.queueType !== 'rated' || queueState.timeControl !== tc.value)}
//                     className={`w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm ${
//                       queueState.inQueue && queueState.queueType === 'rated' && queueState.timeControl === tc.value
//                         ? 'bg-red-500/80 hover:bg-red-500 text-white border border-red-400'
//                         : 'bg-blue-500/80 hover:bg-blue-500 text-white disabled:bg-gray-500/50 disabled:cursor-not-allowed border border-blue-400 hover:border-blue-300'
//                     }`}
//                   >
//                     {queueState.inQueue && queueState.queueType === 'rated' && queueState.timeControl === tc.value
//                       ? 'Cancel Queue'
//                       : 'Rated'}
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
        
//         {queueState.inQueue && (
//           <div className="mt-6 bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 backdrop-blur-sm">
//             <div className="flex items-center">
//               <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin mr-3"></div>
//               <p className="text-blue-200">
//                 Searching for {queueState.queueType} opponent ({timeControls.find(tc => tc.value === queueState.timeControl)?.label})...
//               </p>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Play Against AI */}
//       <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20">
//         <div className="flex items-center mb-6">
//           <Bot className="w-6 h-6 text-purple-300 mr-3" />
//           <h3 className="text-xl font-semibold text-white">Play Against AI</h3>
//         </div>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {timeControls.map((tc) => {
//             const Icon = tc.icon;
//             return (
//               <div key={`ai-${tc.value}`} className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
//                 <div className="flex items-center justify-between mb-3">
//                   <div className="flex items-center">
//                     <Icon className="w-5 h-5 text-purple-300 mr-2" />
//                     <span className="font-semibold text-white text-lg">{tc.label}</span>
//                   </div>
//                   <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full border border-purple-500/30">
//                     {tc.description}
//                   </span>
//                 </div>
                
//                 <div className="space-y-3">
//                   {[
//                     { level: 3, label: 'Easy', color: 'bg-green-500/80 hover:bg-green-500 border-green-400' },
//                     { level: 8, label: 'Medium', color: 'bg-yellow-500/80 hover:bg-yellow-500 border-yellow-400' },
//                     { level: 15, label: 'Hard', color: 'bg-red-500/80 hover:bg-red-500 border-red-400' }
//                   ].map((difficulty) => (
//                     <button
//                       key={difficulty.level}
//                       onClick={() => handleCreateRoom('ai', tc.value, difficulty.level)}
//                       className={`w-full py-3 px-4 rounded-lg text-sm font-medium text-white transition-all duration-200 backdrop-blur-sm border ${difficulty.color}`}
//                     >
//                       {difficulty.label}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import {
  Users,
  Bot,
  Zap,
  Timer,
  Infinity,
  Clock,
  Star,
  Target,
  Trophy,
  Play,
  LoaderCircle,
  Gamepad2,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import dotenv from 'dotenv';

// dotenv.config();

interface QueueState {
  inQueue: boolean;
  queueType: string;
  timeControl: number;
}

interface GameMode {
  id: 'quick' | 'ai';
  label: string;
  icon: React.ElementType;
  color: string;
}

interface TimeControl {
  value: number;
  label: string;
  icon: React.ElementType;
  description: string;
}

interface Difficulty {
  level: number;
  label: string;
  color: string;
  icon: React.ElementType;
}

export const PlayMenu: React.FC = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [queueState, setQueueState] = useState<QueueState>({
    inQueue: false,
    queueType: '',
    timeControl: 0
  });

  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeControl | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  const [isModeOpen, setIsModeOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);

  const timeControls: TimeControl[] = [
    { value: 180, label: '3 min', icon: Zap, description: 'Lightning' },
    { value: 300, label: '5 min', icon: Timer, description: 'Blitz' },
    { value: 600, label: '10 min', icon: Clock, description: 'Rapid' },
    { value: 900, label: '15 min', icon: Clock, description: 'Standard' },
    { value: 1800, label: '30 min', icon: Clock, description: 'Classical' },
    { value: -1, label: '∞', icon: Infinity, description: 'Unlimited' },
  ];

  const difficultyLevels: Difficulty[] = [
    { level: 3, label: 'Beginner', color: 'bg-emerald-500/80 hover:bg-emerald-400', icon: Star },
    { level: 8, label: 'Intermediate', color: 'bg-amber-500/80 hover:bg-amber-400', icon: Target },
    { level: 15, label: 'Master', color: 'bg-rose-500/80 hover:bg-rose-400', icon: Trophy }
  ];

  const gameModes: GameMode[] = [
    { id: 'quick', label: 'Quick Match', icon: Users, color: 'from-blue-500 to-cyan-500' },
    { id: 'ai', label: 'Practice AI', icon: Bot, color: 'from-purple-500 to-pink-500' }
  ];

  useEffect(() => {
    if (!socket) return;

    const matchFoundHandler = (data: any) => {
      setQueueState({ inQueue: false, queueType: '', timeControl: 0 });
      navigate(`/game/${data.roomId}`);
    };

    const queueLeftHandler = () => {
      setQueueState({ inQueue: false, queueType: '', timeControl: 0 });
    };

    socket.on('match_found', matchFoundHandler);
    socket.on('queue_left', queueLeftHandler);

    return () => {
      socket.off('match_found', matchFoundHandler);
      socket.off('queue_left', queueLeftHandler);
    };
  }, [socket, navigate]);

  const handleQuickMatch = (matchType: 'casual' | 'rated', time: number) => {
    if (!socket) return alert('Not connected to server');

    if (queueState.inQueue) {
      socket.emit('leave_queue');
      setQueueState({ inQueue: false, queueType: '', timeControl: 0 });
      return;
    }

    socket.emit('join_queue', { matchType, timeControl: time, preferredColor: 'random' });
    setQueueState({ inQueue: true, queueType: matchType, timeControl: time });
  };

  const handleCreateRoom = async (time: number, aiLevel: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URI}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ timeControl: time, matchType: selectedMode?.id, isPrivate: false, aiLevel })
      });

      if (!res.ok) {
        const err = await res.json();
        return alert(err.message || 'Failed to create room');
      }

      const data = await res.json();
      navigate(`/game/${data.room.roomId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create room');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 flex justify-center items-start">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 shadow-2xl">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Chess Arena</h1>
          <p className="text-purple-200">Select your battlefield</p>
        </div>

        {/* Game Mode Selector */}
        <div className="bg-black/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 space-y-6">
          <div className="relative">
            <button
              onClick={() => setIsModeOpen(!isModeOpen)}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-4 flex justify-between items-center text-white font-semibold hover:from-blue-500 hover:to-cyan-400 shadow-lg transition-all"
            >
              {selectedMode?.label || 'Select Game Mode'}
              <ChevronDown className={`w-5 h-5 transition-transform ${isModeOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isModeOpen && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-10">
                  {gameModes.map((mode) => (
                    <button key={mode.id} onClick={() => { setSelectedMode(mode); setIsModeOpen(false); setSelectedDifficulty(null); }} className="w-full p-4 hover:bg-white/10 text-white flex items-center font-medium">
                      <mode.icon className="w-5 h-5 mr-3" /> {mode.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time Control Selector */}
          {selectedMode && (
            <div className="relative">
              <button onClick={() => setIsTimeOpen(!isTimeOpen)} className="w-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-4 flex justify-between items-center text-white font-semibold hover:from-purple-500 hover:to-pink-400 shadow-lg transition-all">
                {selectedTime?.label || 'Select Time Control'}
                <ChevronDown className={`w-5 h-5 transition-transform ${isTimeOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isTimeOpen && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-10">
                    {timeControls.map((tc) => (
                      <button key={tc.value} onClick={() => { setSelectedTime(tc); setIsTimeOpen(false); }} className="w-full p-4 hover:bg-white/10 text-white flex items-center justify-between font-medium">
                        <div className="flex items-center">
                          <tc.icon className="w-5 h-5 mr-2" /> {tc.label}
                        </div>
                        <span className="text-purple-300 text-sm">({tc.description})</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Difficulty Selector (AI) */}
          {selectedMode?.id === 'ai' && selectedTime && (
            <div className="relative">
              <button onClick={() => setIsDifficultyOpen(!isDifficultyOpen)} className="w-full bg-gradient-to-r from-emerald-500 to-lime-500 rounded-xl p-4 flex justify-between items-center text-white font-semibold hover:from-emerald-400 hover:to-lime-400 shadow-lg transition-all">
                {selectedDifficulty?.label || 'Select AI Difficulty'}
                <ChevronDown className={`w-5 h-5 transition-transform ${isDifficultyOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isDifficultyOpen && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-full left-0 right-0 mt-2 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-10">
                    {difficultyLevels.map((diff) => (
                      <button key={diff.level} onClick={() => { setSelectedDifficulty(diff); setIsDifficultyOpen(false); }} className={`w-full p-4 hover:opacity-90 text-white flex items-center justify-between font-medium rounded-lg ${diff.color}`}>
                        <div className="flex items-center"><diff.icon className="w-5 h-5 mr-2" /> {diff.label}</div>
                        <span className="text-white/80">Level {diff.level}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4">
            {selectedMode && selectedTime && (
              selectedMode.id === 'ai' ? (
                <button onClick={() => selectedDifficulty && handleCreateRoom(selectedTime.value, selectedDifficulty.level)} disabled={!selectedDifficulty} className={`w-full py-4 rounded-xl font-semibold text-white flex justify-center items-center space-x-3 transition-all ${selectedDifficulty ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 shadow-lg' : 'bg-gray-600 cursor-not-allowed'}`}>
                  <Play className="w-5 h-5" /> <span>Challenge AI</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleQuickMatch('casual', selectedTime.value)} className="py-3 px-4 rounded-xl text-white font-semibold bg-green-500 hover:bg-green-400 transition-all w-full flex justify-center">Casual</button>
                  <button onClick={() => handleQuickMatch('rated', selectedTime.value)} className="py-3 px-4 rounded-xl text-white font-semibold bg-blue-500 hover:bg-blue-400 transition-all w-full flex justify-center">Rated</button>
                </div>
              )
            )}
          </div>

          {/* Queue Status */}
          <AnimatePresence>
            {queueState.inQueue && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mt-4 bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 backdrop-blur-sm flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-300 animate-pulse" />
                <p className="text-blue-200">Searching for {queueState.queueType} opponent ({timeControls.find(tc => tc.value === queueState.timeControl)?.label})...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
