import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface AuthScreenProps {
  onAuth: (userId: number, userData: any) => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [step, setStep] = useState<'phone' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const avatars = ['👤', '😊', '😎', '🎨', '💼', '🚀', '🎮', '📚', '🎵', '⚡', '🌟', '🔥'];

  const handlePhoneSubmit = async () => {
    if (!phone.trim()) {
      setError('Введите номер телефона');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://functions.poehali.dev/d758c927-0136-4b21-9db3-96b968cfd804', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('shtorm_user_id', data.user.id.toString());
        localStorage.setItem('shtorm_user_data', JSON.stringify(data.user));
        onAuth(data.user.id, data.user);
      } else {
        setStep('name');
      }
    } catch (err) {
      setError('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setError('Введите имя');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://functions.poehali.dev/d758c927-0136-4b21-9db3-96b968cfd804', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register',
          phone: phone.trim(),
          name: name.trim(),
          avatar: avatar,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('shtorm_user_id', data.user.id.toString());
        localStorage.setItem('shtorm_user_data', JSON.stringify(data.user));
        onAuth(data.user.id, data.user);
      } else {
        setError(data.error || 'Ошибка регистрации');
      }
    } catch (err) {
      setError('Ошибка подключения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl text-4xl">
            ⚡
          </div>
          <div>
            <h1 className="text-3xl font-bold">Shtorm</h1>
            <p className="text-muted-foreground mt-2">
              Защищенный мессенджер с шифрованием
            </p>
          </div>
        </div>

        {step === 'phone' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-sm font-medium mb-2">
                Номер телефона
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePhoneSubmit()}
                placeholder="+7 999 123 45 67"
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <Icon name="AlertCircle" size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handlePhoneSubmit}
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Проверка...' : 'Продолжить'}
            </button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <Icon name="Lock" size={16} />
              <span>Сквозное шифрование всех сообщений</span>
            </div>
          </div>
        )}

        {step === 'name' && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={() => setStep('phone')}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon name="ChevronLeft" size={16} />
              Назад
            </button>

            <div>
              <label className="block text-sm font-medium mb-2">
                Ваше имя
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                placeholder="Иван Иванов"
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Выберите аватар
              </label>
              <div className="grid grid-cols-6 gap-2">
                {avatars.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setAvatar(emoji)}
                    className={`w-12 h-12 text-2xl rounded-lg transition-all ${
                      avatar === emoji
                        ? 'bg-primary scale-110'
                        : 'bg-card hover:bg-accent'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <Icon name="AlertCircle" size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
