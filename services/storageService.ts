import { Message, User, GameState } from '../types';
import { STORAGE_KEY_MESSAGES, STORAGE_KEY_TYPING, STORAGE_KEY_USERS, STORAGE_KEY_GAME } from '../constants';

// Helper to generate random IDs
export const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Messages ---

export const getStoredMessages = (): Message[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse messages", e);
    return [];
  }
};

export const saveMessageToStorage = (message: Message) => {
  const messages = getStoredMessages();
  messages.push(message);
  // Limit history to last 100 messages for performance in this demo
  if (messages.length > 100) messages.shift();
  
  localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  
  // Dispatch a custom event for the current tab to update immediately if needed,
  // though standard React state usually handles local, this helps consistent architecture.
  window.dispatchEvent(new Event('local-storage-update'));
};

export const deleteMessageFromStorage = (messageId: string) => {
  const messages = getStoredMessages().filter(m => m.id !== messageId);
  localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  window.dispatchEvent(new Event('local-storage-update'));
};

export const toggleMessageReaction = (messageId: string, userId: string, emoji: string) => {
  const messages = getStoredMessages();
  const msgIndex = messages.findIndex(m => m.id === messageId);
  
  if (msgIndex !== -1) {
    const msg = messages[msgIndex];
    if (!msg.reactions) msg.reactions = {};
    
    const currentUsers = msg.reactions[emoji] || [];
    
    if (currentUsers.includes(userId)) {
      // Remove reaction
      msg.reactions[emoji] = currentUsers.filter(id => id !== userId);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      // Add reaction
      msg.reactions[emoji] = [...currentUsers, userId];
    }
    
    messages[msgIndex] = msg;
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    window.dispatchEvent(new Event('local-storage-update'));
  }
};

export const markMessagesAsRead = (currentUserId: string) => {
  try {
    const messages = getStoredMessages();
    let hasChanges = false;
    
    const updatedMessages = messages.map(msg => {
      // If message is not mine AND is not read yet
      // We assume if it's displayed on screen (which calls this), it's read
      if (msg.senderId !== currentUserId && msg.status !== 'read') {
        hasChanges = true;
        return { ...msg, status: 'read' as const };
      }
      return msg;
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updatedMessages));
      window.dispatchEvent(new Event('local-storage-update'));
    }
  } catch (e) {
    console.error("Failed to mark messages as read", e);
  }
};

// --- Typing Status ---

export const setTypingStatus = (username: string, isTyping: boolean) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TYPING);
    const typingMap: Record<string, number> = stored ? JSON.parse(stored) : {};
    
    if (isTyping) {
      typingMap[username] = Date.now();
    } else {
      delete typingMap[username];
    }
    
    // Cleanup old typing statuses (> 5 seconds)
    const now = Date.now();
    Object.keys(typingMap).forEach(key => {
      if (now - typingMap[key] > 5000) delete typingMap[key];
    });

    localStorage.setItem(STORAGE_KEY_TYPING, JSON.stringify(typingMap));
    // Notify other tabs
    window.dispatchEvent(new Event('local-storage-typing')); 
  } catch (e) {
    console.error(e);
  }
};

export const getTypingUsers = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TYPING);
    if (!stored) return [];
    const typingMap: Record<string, number> = JSON.parse(stored);
    const now = Date.now();
    return Object.keys(typingMap).filter(user => now - typingMap[user] < 3000); // Valid if updated in last 3s
  } catch (e) {
    return [];
  }
};

// --- Users ---
// Simple presence simulation
export const updatePresence = (user: User) => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_USERS);
        let users: User[] = stored ? JSON.parse(stored) : [];
        
        // Remove self if exists
        users = users.filter(u => u.id !== user.id);
        // Add updated self
        users.push({ ...user, lastSeen: Date.now(), isOnline: true });
        
        // Remove stale users (> 30s)
        const now = Date.now();
        users = users.filter(u => now - u.lastSeen < 30000);

        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch(e) {
        console.error(e);
    }
}

export const getOnlineUsers = (): User[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_USERS);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch(e) {
        return [];
    }
}

// --- Games (Tic-Tac-Toe) ---

export const getGameState = (): GameState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_GAME);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  
  // Default state
  return {
    active: false,
    board: Array(9).fill(null),
    xPlayerId: null,
    oPlayerId: null,
    currentTurn: 'X',
    winner: null,
    winningLine: null
  };
};

export const updateGameState = (newState: GameState) => {
  localStorage.setItem(STORAGE_KEY_GAME, JSON.stringify(newState));
  window.dispatchEvent(new Event('local-storage-game'));
};