import Icon from '@/components/ui/icon';

interface SidebarProps {
  activePage: 'chats' | 'contacts' | 'profile';
  onPageChange: (page: 'chats' | 'contacts' | 'profile') => void;
}

export default function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const menuItems = [
    { id: 'chats' as const, icon: 'MessageSquare', label: 'Чаты' },
    { id: 'contacts' as const, icon: 'Users', label: 'Контакты' },
    { id: 'profile' as const, icon: 'User', label: 'Профиль' },
  ];

  return (
    <div className="w-20 bg-card border-r border-border flex flex-col items-center py-6 gap-4">
      <div className="mb-8">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-2xl">
          ⚡
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all hover:bg-accent ${
              activePage === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
            title={item.label}
          >
            <Icon name={item.icon} size={24} />
          </button>
        ))}
      </div>

      <button className="w-14 h-14 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors">
        <Icon name="Settings" size={24} />
      </button>
    </div>
  );
}
