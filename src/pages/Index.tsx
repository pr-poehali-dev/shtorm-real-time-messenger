import { useState } from 'react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import Sidebar from '../components/Sidebar';
import Icon from '@/components/ui/icon';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'contact';
  timestamp: Date;
  encrypted: boolean;
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: string;
  online: boolean;
}

export default function Index() {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<'chats' | 'contacts' | 'profile'>('chats');

  const [chats] = useState<Chat[]>([
    {
      id: '1',
      name: 'Анна Смирнова',
      avatar: '👩‍💼',
      lastMessage: 'Встретимся завтра?',
      timestamp: '14:32',
      unread: 2,
      online: true,
    },
    {
      id: '2',
      name: 'Команда Shtorm',
      avatar: '⚡',
      lastMessage: 'Новое обновление доступно',
      timestamp: '13:15',
      unread: 0,
      online: false,
    },
    {
      id: '3',
      name: 'Михаил Петров',
      avatar: '👨‍💻',
      lastMessage: 'Отправил файлы',
      timestamp: 'Вчера',
      unread: 0,
      online: false,
    },
  ]);

  const [contacts] = useState<Contact[]>([
    { id: '1', name: 'Анна Смирнова', avatar: '👩‍💼', status: 'В сети', online: true },
    { id: '2', name: 'Михаил Петров', avatar: '👨‍💻', status: 'Был недавно', online: false },
    { id: '3', name: 'Елена Волкова', avatar: '👩‍🎨', status: 'В сети', online: true },
    { id: '4', name: 'Дмитрий Иванов', avatar: '👨‍🔬', status: 'Был 2 часа назад', online: false },
  ]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    '1': [
      {
        id: '1',
        text: 'Привет! Как дела?',
        sender: 'contact',
        timestamp: new Date(Date.now() - 3600000),
        encrypted: true,
      },
      {
        id: '2',
        text: 'Отлично! Работаю над новым проектом',
        sender: 'user',
        timestamp: new Date(Date.now() - 3000000),
        encrypted: true,
      },
      {
        id: '3',
        text: 'Звучит интересно! Расскажешь подробнее?',
        sender: 'contact',
        timestamp: new Date(Date.now() - 2400000),
        encrypted: true,
      },
      {
        id: '4',
        text: 'Конечно! Это защищенный мессенджер с шифрованием',
        sender: 'user',
        timestamp: new Date(Date.now() - 1800000),
        encrypted: true,
      },
      {
        id: '5',
        text: 'Встретимся завтра?',
        sender: 'contact',
        timestamp: new Date(Date.now() - 600000),
        encrypted: true,
      },
    ],
  });

  const handleSendMessage = (text: string) => {
    if (!activeChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
      encrypted: true,
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage],
    }));
  };

  const selectedChat = chats.find((chat) => chat.id === activeChat);
  const chatMessages = activeChat ? messages[activeChat] || [] : [];

  return (
    <div className="h-screen flex bg-background">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      
      {activePage === 'chats' && (
        <>
          <ChatList
            chats={chats}
            activeChat={activeChat}
            onChatSelect={setActiveChat}
          />
          <ChatWindow
            chat={selectedChat}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
          />
        </>
      )}

      {activePage === 'contacts' && (
        <div className="flex-1 flex flex-col">
          <div className="border-b border-border bg-card p-6">
            <h1 className="text-2xl font-semibold mb-4">Контакты</h1>
            <div className="relative">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Поиск контактов..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-4 p-4 hover:bg-accent rounded-lg cursor-pointer transition-colors"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                    {contact.avatar}
                  </div>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground">{contact.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activePage === 'profile' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-5xl">
                👤
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-semibold">Мой Профиль</h2>
                <p className="text-muted-foreground">+7 999 123 45 67</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-card rounded-lg border border-border">
                <h3 className="font-medium mb-2">Имя</h3>
                <input
                  type="text"
                  placeholder="Введите имя"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div className="p-4 bg-card rounded-lg border border-border">
                <h3 className="font-medium mb-2">Статус</h3>
                <input
                  type="text"
                  placeholder="Ваш статус"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="p-4 bg-card rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Сквозное шифрование</h3>
                    <p className="text-sm text-muted-foreground">Защита всех сообщений</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-500">Активно</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-card rounded-lg border border-border">
                <h3 className="font-medium mb-3">Настройки</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">Уведомления</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">Звук сообщений</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm">Темная тема</span>
                    <input type="checkbox" className="toggle" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}