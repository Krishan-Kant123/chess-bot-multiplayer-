import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

interface ChessBoardProps {
  fen: string;
  orientation: 'white' | 'black';
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  currentTurn: 'white' | 'black';
  userColor: 'white' | 'black';
  disabled?: boolean;
}

const PIECE_UNICODE: { [key: string]: string } = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟',
};

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  orientation,
  onMove,
  currentTurn,
  userColor,
  disabled = false
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);
  const [chess] = useState(new Chess());
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);

  useEffect(() => {
    const previousFen = chess.fen();
    chess.load(fen);
    
    // Track last move for highlighting
    if (previousFen !== fen) {
      const history = chess.history({ verbose: true });
      if (history.length > 0) {
        const lastMoveData = history[history.length - 1];
        setLastMove({ from: lastMoveData.from, to: lastMoveData.to });
      }
    }
  }, [fen, chess]);

  const isUserTurn = currentTurn === userColor && !disabled;

  const handleSquareClick = (square: string) => {
    if (!isUserTurn) return;

    const piece = chess.get(square as any);
    
    if (selectedSquare && possibleMoves.includes(square)) {
      // Make move
      const move = chess.move({
        from: selectedSquare,
        to: square,
        promotion: 'q' // Auto-promote to queen for simplicity
      });
      
      if (move) {
        onMove({ from: selectedSquare, to: square, promotion: 'q' });
      }
      
      setSelectedSquare(null);
      setPossibleMoves([]);
    } else if (piece && piece.color === userColor.charAt(0)) {
      // Select piece
      setSelectedSquare(square);
      const moves = chess.moves({ square: square as any, verbose: true });
      setPossibleMoves(moves.map(move => move.to));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const renderBoard = () => {
    const squares = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    if (orientation === 'black') {
      files.reverse();
      ranks.reverse();
    }

    for (let rank of ranks) {
      for (let file of files) {
        const square = `${file}${rank}`;
        const piece = chess.get(square as any);
        const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 0;
        const isSelected = selectedSquare === square;
        const isPossibleMove = possibleMoves.includes(square);
        const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);

        let squareClass = `w-12 h-12 flex items-center justify-center text-2xl cursor-pointer transition-all duration-200 `;
        
        if (isLight) {
          squareClass += isSelected ? 'bg-yellow-300 ' : 
                        isPossibleMove ? 'bg-green-300 ' : 
                        isLastMove ? 'bg-blue-300 ' : 'bg-amber-100 ';
        } else {
          squareClass += isSelected ? 'bg-yellow-400 ' : 
                        isPossibleMove ? 'bg-green-400 ' : 
                        isLastMove ? 'bg-blue-400 ' : 'bg-amber-800 ';
        }
        
        if (isUserTurn && piece && piece.color === userColor.charAt(0)) {
          squareClass += 'hover:bg-blue-200 ';
        }
        
        if (!isUserTurn) {
          squareClass += 'cursor-not-allowed opacity-75 ';
        }

        squares.push(
          <div
            key={square}
            className={squareClass}
            onClick={() => handleSquareClick(square)}
          >
            {piece && PIECE_UNICODE[`${piece.color}${piece.type.toUpperCase()}`]}
            {isPossibleMove && !piece && (
              <div className="w-3 h-3 bg-green-600 rounded-full opacity-60" />
            )}
          </div>
        );
      }
    }

    return squares;
  };

  return (
    <div className="inline-block border-4 border-amber-900 rounded-lg shadow-2xl">
      <div className="grid grid-cols-8 gap-0">
        {renderBoard()}
      </div>
    </div>
  );
};