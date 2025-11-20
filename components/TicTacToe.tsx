import React, { useEffect } from 'react';
import { X, Circle, RotateCcw, Trophy, User, Users } from 'lucide-react';
import { GameState } from '../types';
import { updateGameState } from '../services/storageService';

interface TicTacToeProps {
  gameState: GameState;
  currentUserId: string;
  onClose: () => void;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ gameState, currentUserId, onClose }) => {
  
  // Auto-join as O player if I'm not X and the slot is empty
  useEffect(() => {
    if (gameState.active && !gameState.oPlayerId && gameState.xPlayerId && gameState.xPlayerId !== currentUserId) {
       updateGameState({
           ...gameState,
           oPlayerId: currentUserId
       });
    }
  }, [gameState, currentUserId]);

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a] as 'X' | 'O', line: lines[i] };
      }
    }
    return null;
  };

  const handleCellClick = (index: number) => {
    if (gameState.winner || gameState.board[index]) return;

    // Determine roles safely
    let effectiveSymbol: 'X' | 'O' | null = null;
    
    if (gameState.xPlayerId === currentUserId) {
        effectiveSymbol = 'X';
    } else if (gameState.oPlayerId === currentUserId) {
        effectiveSymbol = 'O';
    } else if (!gameState.oPlayerId && gameState.xPlayerId !== currentUserId) {
        // Fallback: Treat as O if we are the second player interacting (race condition safety)
        effectiveSymbol = 'O';
    }

    if (!effectiveSymbol) return; // Spectator
    if (effectiveSymbol !== gameState.currentTurn) return;

    // Ensure opponent exists before playing (Wait for join)
    const willHaveO = gameState.oPlayerId || effectiveSymbol === 'O';
    const willHaveX = gameState.xPlayerId || effectiveSymbol === 'X';
    if (!willHaveO || !willHaveX) return;

    const newBoard = [...gameState.board];
    newBoard[index] = effectiveSymbol;

    const winResult = calculateWinner(newBoard);
    let newWinner = gameState.winner;
    let newWinningLine = gameState.winningLine;

    if (winResult) {
        newWinner = winResult.winner;
        newWinningLine = winResult.line;
    } else if (!newBoard.includes(null)) {
        newWinner = 'draw';
    }

    // Update state (and implicitly assign O if it was null and we just played as O)
    updateGameState({
        ...gameState,
        board: newBoard,
        oPlayerId: gameState.oPlayerId || (effectiveSymbol === 'O' ? currentUserId : null),
        currentTurn: effectiveSymbol === 'X' ? 'O' : 'X',
        winner: newWinner,
        winningLine: newWinningLine
    });
  };

  const handleRestart = () => {
     updateGameState({
        active: true,
        board: Array(9).fill(null),
        xPlayerId: gameState.xPlayerId,
        oPlayerId: gameState.oPlayerId,
        currentTurn: 'X',
        winner: null,
        winningLine: null
     });
  };

  const handleQuit = () => {
    updateGameState({
        ...gameState,
        active: false,
        board: Array(9).fill(null),
        winner: null
    });
    onClose();
  };

  const isGameReady = !!gameState.xPlayerId && !!gameState.oPlayerId;
  
  // Determine my role for UI
  let myRole = 'Зритель';
  if (gameState.xPlayerId === currentUserId) myRole = 'Крестики (X)';
  else if (gameState.oPlayerId === currentUserId) myRole = 'Нолики (O)';
  else if (!gameState.oPlayerId && gameState.xPlayerId !== currentUserId) myRole = 'Нолики (O)'; // Pending auto-join

  // Check turn
  const isMyTurn = (gameState.xPlayerId === currentUserId && gameState.currentTurn === 'X') ||
                   (gameState.oPlayerId === currentUserId && gameState.currentTurn === 'O');

  let statusMessage = '';
  let statusIcon = <User className="w-4 h-4" />;

  if (!isGameReady) {
      statusMessage = 'Ожидание второго игрока...';
      statusIcon = <Users className="w-4 h-4 animate-pulse" />;
  } else if (gameState.winner) {
      statusMessage = gameState.winner === 'draw' ? 'Ничья!' : `Победил ${gameState.winner}!`;
      statusIcon = <Trophy className="w-4 h-4 text-yellow-400" />;
  } else {
      statusMessage = isMyTurn ? 'Ваш ход' : `Ход ${gameState.currentTurn}`;
  }

  return (
    <div className="absolute inset-0 z-30 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Крестики-Нолики
        </h2>
        <div className="flex items-center justify-center gap-2 text-slate-300 bg-slate-800/50 py-1 px-4 rounded-full border border-slate-700 transition-all duration-300">
            {statusIcon}
            <span className="font-mono uppercase tracking-widest text-sm">{statusMessage}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8 p-3 bg-slate-800 rounded-2xl shadow-2xl shadow-blue-900/20 border border-slate-700">
        {gameState.board.map((cell, i) => {
            const isWinningCell = gameState.winningLine?.includes(i);
            const canInteract = !cell && !gameState.winner && isMyTurn && isGameReady;

            return (
                <button
                    key={i}
                    onClick={() => handleCellClick(i)}
                    disabled={!canInteract}
                    className={`
                        w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center text-4xl font-bold transition-all duration-200
                        ${canInteract ? 'hover:bg-slate-700 cursor-pointer active:scale-95' : 'cursor-default'}
                        ${isWinningCell ? 'bg-green-500/20 ring-2 ring-green-500 scale-105' : 'bg-slate-900'}
                        ${!isGameReady ? 'opacity-50' : 'opacity-100'}
                    `}
                >
                    {cell === 'X' && <X className={`w-12 h-12 sm:w-16 sm:h-16 animate-in zoom-in duration-300 ${isWinningCell ? 'text-green-400' : 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]'}`} />}
                    {cell === 'O' && <Circle className={`w-10 h-10 sm:w-14 sm:h-14 animate-in zoom-in duration-300 ${isWinningCell ? 'text-green-400' : 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]'}`} />}
                </button>
            );
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        {gameState.winner && (
             <button 
                onClick={handleRestart}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg transition-transform active:scale-95"
            >
                <RotateCcw className="w-5 h-5" />
                Играть снова
            </button>
        )}
        <button 
            onClick={handleQuit}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-medium border border-slate-700 transition-colors"
        >
            Закрыть
        </button>
      </div>
      
      <div className="mt-8 text-xs text-slate-500">
         Вы играете за <span className="font-bold text-slate-300">{myRole}</span>
      </div>
    </div>
  );
};

export default TicTacToe;