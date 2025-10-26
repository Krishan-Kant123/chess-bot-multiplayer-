// import axios from 'axios';

// class StockfishAPI {
//   constructor() {
//     this.baseURL = 'https://stockfish.online/api/s/v2.php';
//   }

//   async getBestMove(fen, depth = 15, mode = 'bestmove',aiLevel) {
   
//     try {
//       const response = await axios.get(this.baseURL, {
//         params: {
//           fen: fen,
//           depth: depth,
//           mode: mode
//         },
//         timeout: 20000 // 10 second timeout
//       });

//       if (response.data && response.data.success) {
//         return {
//           bestmove: response.data.bestmove,
//           evaluation: response.data.evaluation,
//           mate: response.data.mate,
//           continuation: response.data.continuation
//         };
//       }
      
//       throw new Error('Invalid response from Stockfish API');
//     } catch (error) {
//       console.error('Stockfish API error:', error.message);
//       throw new Error('Failed to get AI move');
//     }
//   }

//   async getRandomMove(fen, possibleMoves) {
//     // Fallback for when Stockfish is unavailable
//     if (possibleMoves && possibleMoves.length > 0) {
//       const randomIndex = Math.floor(Math.random() * possibleMoves.length);
//       return { bestmove: possibleMoves[randomIndex] };
//     }
//     throw new Error('No possible moves available');
//   }
// }

// export default new StockfishAPI();


// import axios from "axios";

// class StockfishAPI {
//   constructor() {
//     this.stockfishOnlineURL = "https://stockfish.online/api/s/v2.php";
//     this.chessApiURL = "https://chess-api.com/v1";
//   }

//   async getBestMove(fen, depth = 15, mode = "bestmove", aiLevel = 10) {
//     try {
//       // 🎯 1. Try Stockfish Online first
//       const response = await axios.get(this.stockfishOnlineURL, {
//         params: { fen, depth, mode },
//         timeout: 15000,
//       });

//       if (response.data && response.data.success && response.data.bestmove) {
//         return {
//           source: "stockfish.online",
//           bestmove: response.data.bestmove,
//           evaluation: response.data.evaluation,
//           mate: response.data.mate,
//           continuation: response.data.continuation,
//         };
//       }

//       throw new Error("Invalid response from Stockfish Online");
//     } catch (error) {
//       console.warn("⚠️ Stockfish Online failed:", error.message);
//       console.log("⏳ Falling back to Chess-API...");

//       // 🧩 2. Fallback to Chess-API
//       try {
//         const chessApiRes = await axios.post(
//           this.chessApiURL,
//           {
//             fen,
//             depth: 12,
//             variants: 1,
//           },
//           { timeout: 15000, headers: { "Content-Type": "application/json" } }
//         );

//         if (chessApiRes.data && chessApiRes.data.move) {
//           return {
//             source: "chess-api.com",
//             bestmove: chessApiRes.data.move,
//             evaluation: chessApiRes.data.eval,
//             mate: chessApiRes.data.mate,
//             continuation: chessApiRes.data.continuationArr || [],
//           };
//         } else {
//           throw new Error("Invalid response from Chess API");
//         }
//       } catch (fallbackError) {
//         console.error("❌ Both Stockfish Online and Chess API failed:", fallbackError.message);
//         throw new Error("Failed to get AI move from all sources");
//       }
//     }
//   }

//   async getRandomMove(fen, possibleMoves) {
//     if (possibleMoves && possibleMoves.length > 0) {
//       const randomIndex = Math.floor(Math.random() * possibleMoves.length);
//       return {
//         source: "random",
//         bestmove: possibleMoves[randomIndex],
//       };
//     }
//     throw new Error("No possible moves available");
//   }
// }

// export default new StockfishAPI();

import axios from 'axios';

class StockfishAPI {
  constructor() {
    this.baseURL = 'https://stockfish.online/api/s/v2.php';
  }

  async getRandomMove(possibleMoves) {
    if (possibleMoves && possibleMoves.length > 0) {
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      return { bestmove: possibleMoves[randomIndex] };
    }
    throw new Error('No possible moves available');
  }

  async getBestMove(fen, depth = 15, possibleMoves = []) {
    try {
      // --- Try Stockfish Online ---
      const response = await axios.get(this.baseURL, {
        params: { fen, depth, mode: 'bestmove' },
        timeout: 20000
      });

      if (response.data && response.data.success) {
        return {
          bestmove: response.data.bestmove,
          evaluation: response.data.evaluation,
          mate: response.data.mate,
          continuation: response.data.continuation
        };
      }

      throw new Error('Invalid response from Stockfish Online');
    } catch (error) {
      console.warn('Stockfish Online failed, using random move:', error.message);
      // --- Fallback to random move ---
      return this.getRandomMove(possibleMoves);
    }
  }
}

export default new StockfishAPI();
