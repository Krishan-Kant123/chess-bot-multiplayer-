import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { Send, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  isGuest: boolean;
}

interface GameChatProps {
  roomId: string;
}

export const GameChat: React.FC<GameChatProps> = ({ roomId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const { socket } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat_message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('chat_message');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !newMessage.trim()) return;

    socket.emit('send_message', {
      roomId,
      message: newMessage.trim()
    });

    setNewMessage('');
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg border border-white/20 h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-white/20">
        <MessageCircle className="w-5 h-5 text-purple-300 mr-2" />
        <h3 className="font-semibold text-white">Game Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-purple-300 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex flex-col">
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-xs font-medium ${
                  message.username === (user?.username || user?.id) 
                    ? 'text-blue-300' 
                    : 'text-purple-300'
                }`}>
                  {message.username}
                  {message.isGuest && (
                    <span className="ml-1 text-xs bg-yellow-500/20 text-yellow-300 px-1 rounded">
                      Guest
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <div className={`text-sm p-2 rounded-lg max-w-xs ${
                message.username === (user?.username || user?.id)
                  ? 'bg-blue-500/20 text-blue-100 ml-auto'
                  : 'bg-purple-500/20 text-purple-100'
              }`}>
                {message.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/20">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-purple-500/20 hover:bg-purple-500/30 disabled:bg-gray-500/20 disabled:cursor-not-allowed border border-purple-500/50 text-purple-200 p-2 rounded-lg transition-all duration-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};