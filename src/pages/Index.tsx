import { useState, useEffect } from 'react';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import Sidebar from '../components/Sidebar';
import AuthScreen from '../components/AuthScreen';
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

const API_AUTH = 'https://functions.poehali.dev/d758c927-0136-4b21-9db3-96b968cfd804';
const API_CHATS = 'https://functions.poehali.dev/b369a9ca-10e6-4dd9-ae9e-599d469eed97';

export default function Index() {
  const [userId, setUserId] = useState<number | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<'chats' | 'contacts' | 'profile'>('chats');

  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  useEffect(() => {
    const savedUserId = localStorage.getItem('shtorm_user_id');
    const savedUserData = localStorage.getItem('shtorm_user_data');
    
    if (savedUserId && savedUserData) {
      setUserId(parseInt(savedUserId));
      setUserData(JSON.parse(savedUserData));
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    loadChats();
    loadContacts();

    const interval = setInterval(() => {
      loadChats();
      if (activeChat) {
        loadMessages(activeChat);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [userId, activeChat]);

  const loadChats = async () => {
    try {
      const response = await fetch(`${API_CHATS}?action=chats`, {
        headers: {
          'X-User-Id': userId!.toString(),
        },
      });
      const data = await response.json();
      setChats(data.chats || []);
    } catch (err) {
      console.error('Failed to load chats', err);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await fetch(`${API_CHATS}?action=contacts`, {
        headers: {
          'X-User-Id': userId!.toString(),
        },
      });
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (err) {
      console.error('Failed to load contacts', err);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`${API_CHATS}?action=messages&chat_id=${chatId}`, {
        headers: {
          'X-User-Id': userId!.toString(),
        },
      });
      const data = await response.json();
      const msgs = data.messages || [];
      setMessages((prev) => ({
        ...prev,
        [chatId]: msgs.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        })),
      }));
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChat(chatId);
    loadMessages(chatId);
  };

  const handleContactClick = async (contactId: number) => {
    try {
      const response = await fetch(API_CHATS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId!.toString(),
        },
        body: JSON.stringify({
          action: 'create_chat',
          user_id: contactId,
        }),
      });
      const data = await response.json();
      await loadChats();
      setActiveChat(data.chat_id.toString());
      setActivePage('chats');
    } catch (err) {
      console.error('Failed to create chat', err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeChat || !userId) return;

    try {
      const response = await fetch(API_CHATS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString(),
        },
        body: JSON.stringify({
          action: 'send_message',
          chat_id: parseInt(activeChat),
          text,
        }),
      });

      if (response.ok) {
        await loadMessages(activeChat);
        await loadChats();
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleAuth = (id: number, data: any) => {
    setUserId(id);
    setUserData(data);
  };

  if (!userId) {
    return <AuthScreen onAuth={handleAuth} />;
  }

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
            onChatSelect={handleChatSelect}
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
                onClick={() => handleContactClick(contact.id)}
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
                {userData?.avatar || '👤'}
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{userData?.name || 'Мой Профиль'}</h2>
                <p className="text-muted-foreground">{userData?.phone || '+7 999 123 45 67'}</p>
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