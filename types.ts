export interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen: number;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
  replyToId?: string;
  isSystem?: boolean; // For "User joined" messages
  reactions?: { [emoji: string]: string[] }; // Key: emoji, Value: array of userIds
}

export interface ChatState {
  messages: Message[];
  typingUsers: string[]; // List of usernames currently typing
}

export interface GameState {
  active: boolean;
  board: Array<string | null>; // 9 cells
  xPlayerId: string | null;
  oPlayerId: string | null;
  currentTurn: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  winningLine: number[] | null; // Indices of winning cells
}