import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import ChatScreen from './components/ChatScreen';
import { User } from './types';
import { generateId } from './services/storageService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Try to restore session from session storage (not local storage, so it resets on tab close mostly, or easy logic)
    const savedUser = sessionStorage.getItem('chat_session_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleJoin = (username: string) => {
    const user: User = {
      id: generateId(),
      username,
      isOnline: true,
      lastSeen: Date.now()
    };
    sessionStorage.setItem('chat_session_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('chat_session_user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginScreen onJoin={handleJoin} />;
  }

  return <ChatScreen currentUser={currentUser} onLogout={handleLogout} />;
};

export default App;