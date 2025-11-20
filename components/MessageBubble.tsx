import React, { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Check, CheckCheck, Trash2, CornerUpLeft, SmilePlus } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  currentUserId: string;
  onReply: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
}

const AVAILABLE_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isOwn, 
  showAvatar, 
  currentUserId,
  onReply, 
  onDelete,
  onReaction 
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  const handleDeleteClick = () => {
    if (window.confirm('Вы действительно хотите удалить это сообщение?')) {
      onDelete(message.id);
    }
  };

  const togglePicker = () => setShowReactionPicker(!showReactionPicker);

  const handleEmojiClick = (emoji: string) => {
    onReaction(message.id, emoji);
    setShowReactionPicker(false);
  };

  if (message.isSystem) {
    return (
      <div className="flex justify-center my-4">
        <span className="px-3 py-1 bg-slate-800/50 text-slate-500 text-xs rounded-full border border-slate-700/50">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div className={`group flex w-full mb-2 ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      
      {/* Avatar placeholder for recipient */}
      {!isOwn && (
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-lg mr-2 flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
          {message.senderName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className={`relative max-w-[75%] md:max-w-[60%] min-w-[120px] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Reply Context */}
        {message.replyToId && (
          <div className={`text-xs mb-1 px-2 flex items-center gap-1 ${isOwn ? 'text-slate-400' : 'text-slate-500'}`}>
             <CornerUpLeft className="w-3 h-3" /> Ответ на сообщение
          </div>
        )}

        {/* Bubble */}
        <div 
          className={`
            relative px-4 py-2 rounded-2xl shadow-md text-sm md:text-base break-words
            ${isOwn 
              ? 'bg-blue-600 text-white rounded-tr-sm' 
              : 'bg-slate-700 text-slate-200 rounded-tl-sm border border-slate-600'}
          `}
        >
            {message.text}

            {/* Reaction Picker Popover */}
            {showReactionPicker && (
              <div className={`absolute bottom-full mb-2 z-50 p-2 bg-slate-800 border border-slate-600 rounded-full shadow-xl flex gap-1 animate-in fade-in zoom-in duration-200 ${isOwn ? 'right-0' : 'left-0'}`}>
                {AVAILABLE_REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-full transition-colors text-lg hover:scale-110 active:scale-95"
                  >
                    {emoji}
                  </button>
                ))}
                {/* Overlay to close on click outside - effectively invisible but catches clicks */}
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowReactionPicker(false)} />
              </div>
            )}
        </div>

        {/* Reactions Display */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(message.reactions).map(([emoji, users]) => {
              const userIds = users as string[];
              if (userIds.length === 0) return null;
              const iReacted = userIds.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  onClick={() => onReaction(message.id, emoji)}
                  className={`
                    flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border transition-all
                    ${iReacted 
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' 
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700'}
                  `}
                >
                  <span>{emoji}</span>
                  <span className="font-medium">{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Meta Data Row */}
        <div className="flex items-center gap-1 mt-1 px-1 select-none">
            
            {/* Action Buttons (Visible on Hover or when picker is open) */}
            <div className={`flex gap-2 transition-opacity duration-200 ${showReactionPicker ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} ${isOwn ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
               <button onClick={togglePicker} className="text-slate-500 hover:text-yellow-400 transition-colors p-1" title="Реакция">
                  <SmilePlus className="w-3 h-3" />
               </button>
               <button onClick={() => onReply(message)} className="text-slate-500 hover:text-blue-400 transition-colors p-1" title="Ответить">
                  <CornerUpLeft className="w-3 h-3" />
               </button>
               {isOwn && (
                   <button onClick={handleDeleteClick} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Удалить">
                      <Trash2 className="w-3 h-3" />
                   </button>
               )}
            </div>

           {/* Time & Status */}
           <div className={`flex items-center gap-1 text-[10px] text-slate-500 ${isOwn ? 'order-2' : 'order-1'}`}>
              <span>
                {format(message.timestamp, 'HH:mm', { locale: ru })}
              </span>
              {isOwn && (
                  <span className={message.status === 'read' ? 'text-blue-400' : 'text-slate-500'}>
                      {message.status === 'read' ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                  </span>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default MessageBubble;