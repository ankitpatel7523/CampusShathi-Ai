import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types.js';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('campussathi_theme') as ThemeMode) || 'light';
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem('campussathi_accent') || 'indigo';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('campussathi_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    localStorage.setItem('campussathi_accent', color);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
