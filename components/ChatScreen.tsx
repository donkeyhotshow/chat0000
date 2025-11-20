import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, LogOut, X, Gamepad2, ChevronDown } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TicTacToe from './TicTacToe';
import { Message, User, GameState } from '../types';
import { 
  getStoredMessages, 
  saveMessageToStorage, 
  deleteMessageFromStorage, 
  generateId, 
  setTypingStatus,
  getTypingUsers,
  updatePresence,
  getOnlineUsers,
  markMessagesAsRead,
  getGameState,
  updateGameState,
  toggleMessageReaction
} from '../services/storageService';

interface ChatScreenProps {
  currentUser: User;
  onLogout: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ currentUser, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>(getGameState());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Synchronization Logic ---

  const syncData = useCallback(() => {
    // 1. Sync Messages
    setMessages(getStoredMessages());
    // 2. Sync Typing Status (exclude self)
    setTypingUsers(getTypingUsers().filter(u => u !== currentUser.username));
    // 3. Sync Online Users
    setOnlineUsers(getOnlineUsers());
    // 4. Sync Game State
    setGameState(getGameState());
  }, [currentUser.username]);

  useEffect(() => {
    // Initial Load
    syncData();
    
    // Setup Heartbeat for presence
    const heartbeat = setInterval(() => {
        updatePresence(currentUser);
        syncData();
    }, 2000);

    // Storage Event Listener (Tab-to-Tab sync)
    const handleStorageChange = (e: StorageEvent) => {
       if (e.key && e.key.startsWith('chat_')) {
           syncData();
       }
    };
    
    const handleLocalUpdate = () => syncData();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleLocalUpdate);
    window.addEventListener('local-storage-typing', handleLocalUpdate);
    window.addEventListener('local-storage-game', handleLocalUpdate);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleLocalUpdate);
      window.removeEventListener('local-storage-typing', handleLocalUpdate);
      window.removeEventListener('local-storage-game', handleLocalUpdate);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [syncData, currentUser]);

  // --- Read Receipt Logic ---
  useEffect(() => {
    const checkReadStatus = () => {
        if (document.visibilityState === 'visible') {
            markMessagesAsRead(currentUser.id);
        }
    };

    // Check immediately when messages change (e.g. new message arrived)
    checkReadStatus();

    // Check when window gains focus
    const handleVisibilityChange = () => checkReadStatus();
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [messages, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUsers.length]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  // --- Handlers ---

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 150;
      setShowScrollBottom(!isBottom);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    if (text.trim().length > 0) {
        // Update status to true
        setTypingStatus(currentUser.username, true);
        
        // Set timeout to clear status after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            setTypingStatus(currentUser.username, false);
        }, 3000);
    } else {
        // Immediately clear if input is empty
        setTypingStatus(currentUser.username, false);
    }
  };

  const sendMessage = (text = inputText) => {
    if (!text.trim()) return;

    // Clear typing status immediately upon sending
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }
    setTypingStatus(currentUser.username, false);

    const newMessage: Message = {
      id: generateId(),
      text: text.trim(),
      senderId: currentUser.id,
      senderName: currentUser.username,
      timestamp: Date.now(),
      status: 'sent',
      replyToId: replyTo?.id
    };

    saveMessageToStorage(newMessage);
    setInputText('');
    setReplyTo(null);
    
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
    }
  };

  const handleDelete = (id: string) => {
    deleteMessageFromStorage(id);
  };
  
  const handleReaction = (messageId: string, emoji: string) => {
    toggleMessageReaction(messageId, currentUser.id, emoji);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleStartGame = () => {
      if (!gameState.active) {
        updateGameState({
            active: true,
            board: Array(9).fill(null),
            xPlayerId: currentUser.id,
            oPlayerId: null, // Will be filled by next interactor
            currentTurn: 'X',
            winner: null,
            winningLine: null
        });
        // Optional: Announce in chat
        sendMessage("🎮 Я начал игру в Крестики-нолики!");
      }
  };

  const otherUsersCount = onlineUsers.filter(u => u.id !== currentUser.id).length;
  const statusText = otherUsersCount > 0 
    ? `${otherUsersCount} чел. в сети`
    : 'Ожидание собеседника...';

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden relative">
      
      {/* Game Overlay */}
      {gameState.active && (
        <TicTacToe 
            gameState={gameState} 
            currentUserId={currentUser.id} 
            onClose={() => setGameState(prev => ({ ...prev, active: false }))}
        />
      )}

      <header className="flex-none h-16 px-4 border-b border-slate-700 bg-slate-800/80 backdrop-blur-md flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold shadow-lg">
              {currentUser.username.charAt(0).toUpperCase()}
           </div>
           <div>
              <h2 className="font-bold text-sm md:text-base leading-tight">Комната 0000</h2>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${otherUsersCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></span>
                <span className="text-xs text-slate-400 font-medium">{statusText}</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-2">
             {/* Game Button */}
             <button
                onClick={handleStartGame}
                className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-full transition-all"
                title="Играть в Крестики-Нолики"
             >
                <Gamepad2 className="w-5 h-5" />
             </button>

             <button 
               onClick={onLogout}
               className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
               title="Выйти"
             >
               <LogOut className="w-5 h-5" />
             </button>
        </div>
      </header>

      <div className="flex-1 relative min-h-0">
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto p-4 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed"
        >
          <div className="text-center text-xs text-slate-500 my-4 opacity-50">
            Сообщения защищены и синхронизируются локально
          </div>
          
          {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
              return (
                  <MessageBubble 
                      key={msg.id} 
                      message={msg} 
                      currentUserId={currentUser.id}
                      isOwn={msg.senderId === currentUser.id}
                      showAvatar={showAvatar}
                      onReply={setReplyTo}
                      onDelete={handleDelete}
                      onReaction={handleReaction}
                  />
              );
          })}

          {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 ml-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <div className="flex gap-1 bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-700 shadow-sm items-center h-10">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-typing-dot" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-typing-dot" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-typing-dot" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs text-slate-500 italic">
                      {typingUsers.join(', ')} печатает...
                  </span>
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-6 right-6 p-3 bg-slate-700/90 hover:bg-blue-600 text-blue-400 hover:text-white backdrop-blur-sm border border-slate-600 hover:border-blue-500 rounded-full shadow-xl transition-all duration-300 animate-in fade-in zoom-in z-10 group"
            title="Прокрутить вниз"
          >
            <ChevronDown className="w-6 h-6 group-hover:translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-none bg-slate-800 border-t border-slate-700 p-4 z-20">
        <div className="max-w-4xl mx-auto">
            {replyTo && (
                <div className="flex items-center justify-between bg-slate-700/50 p-2 rounded-lg mb-2 border-l-2 border-blue-500 animate-in slide-in-from-bottom-2">
                    <div className="overflow-hidden">
                        <p className="text-xs text-blue-400 font-medium">Ответ {replyTo.senderName}</p>
                        <p className="text-sm text-slate-300 truncate opacity-80">{replyTo.text}</p>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-slate-600 rounded-full transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            )}
            
            <div className="flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleTyping}
                    onKeyDown={handleKeyDown}
                    placeholder="Напишите сообщение..."
                    rows={1}
                    className="flex-1 bg-slate-900/50 border border-slate-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none min-h-[46px] max-h-32 overflow-y-auto custom-scrollbar transition-all placeholder:text-slate-500"
                />
                <button 
                    onClick={() => sendMessage()}
                    disabled={!inputText.trim()}
                    className="flex-none p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition-all shadow-lg active:scale-95 disabled:shadow-none"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;