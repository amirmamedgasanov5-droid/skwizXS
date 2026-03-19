import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type Language = 'ru' | 'en';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations = {
  ru: {
    // Menu & Nav
    feed: "Лента",
    search: "Поиск",
    groups: "Сообщества",
    direct: "Direct",
    profile: "Профиль",
    
    // Side Menu
    wallet: "Кошелек",
    ai_assistant: "Нейросеть (AI)",
    profile_settings: "Настройки профиля",
    logout: "Выйти",
    about_me: "О СЕБЕ",
    empty_bio: "Био не заполнено.",
    
    // Settings
    settings_title: "Настройки",
    account_label: "АККАУНТ",
    privacy_label: "ПРИВАТНОСТЬ",
    interface_label: "ИНТЕРФЕЙС",
    online_status: "Статус \"В сети\"",
    notifications: "Уведомления",
    sounds: "Звуки",
    dark_mode: "Dark Mode",
    language: "Язык",
    save_changes: "Сохранить изменения",
    saving: "Сохранение...",
    
    // Wallet
    my_nfts: "Мои NFT",
    market: "Биржа",
    mint_shop: "Магазин (Mint)",
    secondary: "Вторичный рынок",
    send: "Отправить",
    
    // General
    popular: "Популярное",
    following: "Подписки",
    empty_feed: "Здесь пока пусто.",
    subscribe_hint: "Подпишитесь на кого-нибудь в поиске."
  },
  en: {
    // Menu & Nav
    feed: "Feed",
    search: "Search",
    groups: "Groups",
    direct: "Direct",
    profile: "Profile",
    
    // Side Menu
    wallet: "Wallet",
    ai_assistant: "AI Assistant",
    profile_settings: "Profile Settings",
    logout: "Log Out",
    about_me: "ABOUT",
    empty_bio: "Bio is empty.",
    
    // Settings
    settings_title: "Settings",
    account_label: "ACCOUNT",
    privacy_label: "PRIVACY",
    interface_label: "INTERFACE",
    online_status: "Online Status",
    notifications: "Notifications",
    sounds: "Sounds",
    dark_mode: "Dark Mode",
    language: "Language",
    save_changes: "Save Changes",
    saving: "Saving...",
    
    // Wallet
    my_nfts: "My NFTs",
    market: "Market",
    mint_shop: "Mint Shop",
    secondary: "Secondary Market",
    send: "Send",
    
    // General
    popular: "Popular",
    following: "Following",
    empty_feed: "Nothing here yet.",
    subscribe_hint: "Find someone to follow in Search."
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or default
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('squwiz_theme') as Theme) || 'light';
    }
    return 'light';
  });

  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('squwiz_lang') as Language) || 'ru';
    }
    return 'ru';
  });

  // Apply Theme to HTML tag
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('squwiz_theme', theme);
  }, [theme]);

  // Save Language
  useEffect(() => {
    localStorage.setItem('squwiz_lang', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ru' ? 'en' : 'ru');
  };

  const t = (key: string): string => {
    // @ts-ignore
    return translations[language][key] || key;
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, language, toggleLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};