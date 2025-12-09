import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import type { Chat, Message } from '../App';

interface ChatWindowProps {
  chat?: Chat;
  messages: Message[];
  onSendMessage: (text: string) => void;
}

export default function ChatWindow({ chat, messages, onSendMessage }: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-6xl">⚡</div>
          <h2 className="text-2xl font-semibold">Добро пожаловать в Shtorm</h2>
          <p className="text-muted-foreground">Выберите чат для начала общения</p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Icon name="Lock" size={16} />
            <span>Сквозное шифрование активно</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="border-b border-border bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
              {chat.avatar}
            </div>
            {chat.online && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card"></div>
            )}
          </div>
          <div>
            <h2 className="font-semibold">{chat.name}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Icon name="Lock" size={12} />
              Шифрование активно
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-lg hover:bg-accent flex items-center justify-center transition-colors">
            <Icon name="Phone" size={20} />
          </button>
          <button className="w-10 h-10 rounded-lg hover:bg-accent flex items-center justify-center transition-colors">
            <Icon name="Video" size={20} />
          </button>
          <button className="w-10 h-10 rounded-lg hover:bg-accent flex items-center justify-center transition-colors">
            <Icon name="MoreVertical" size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-md px-4 py-2 rounded-2xl ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border'
              }`}
            >
              <p className="break-words">{message.text}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className={`text-xs ${message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {message.timestamp.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {message.sender === 'user' && (
                  <Icon name="Check" size={14} className="text-primary-foreground/70" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-card p-4">
        <div className="flex items-end gap-3">
          <button className="w-10 h-10 rounded-lg hover:bg-accent flex items-center justify-center transition-colors">
            <Icon name="Paperclip" size={20} />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Сообщение..."
              rows={1}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <Icon name="Send" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
