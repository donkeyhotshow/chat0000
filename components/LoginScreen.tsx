import React, { useState } from 'react';
import { Lock, LogIn, UserCircle } from 'lucide-react';
import { ROOM_CODE } from '../constants';

interface LoginScreenProps {
  onJoin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onJoin }) => {
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code !== ROOM_CODE) {
      setError('Неверный код комнаты');
      return;
    }

    if (!username.trim()) {
      setError('Введите имя пользователя');
      return;
    }

    if (username.length > 15) {
        setError('Имя слишком длинное (макс. 15 символов)');
        return;
    }

    onJoin(username);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-2xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-600/20 rounded-full ring-1 ring-blue-500/50">
            <Lock className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-white mb-2">Вход в чат</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Введите код доступа 0000 для начала приватного общения</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider ml-1">Код комнаты</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="password"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="0000"
                maxLength={4}
                className="w-full bg-slate-900/50 border border-slate-600 text-center text-white text-lg tracking-[0.5em] font-mono rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-600 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 uppercase tracking-wider ml-1">Ваше имя</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Придумайте никнейм"
                className="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-600 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Войти
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;