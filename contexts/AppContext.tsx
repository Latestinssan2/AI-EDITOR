import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Theme, ColorScheme, AIMode, Project } from '../types';
import * as authService from '../services/authService';

interface AppContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<User>;
  signup: (email: string, pass: string) => Promise<User>;
  logout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  aiMode: AIMode;
  setAiMode: (mode: AIMode) => void;
  apiKey: string | null;
  setApiKey: (key: string) => void;
  isAdmin: boolean;
  projectToLoad: Project | null;
  setProjectToLoad: (project: Project | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [theme, setThemeState] = useState<Theme>(
    (localStorage.getItem('theme') as Theme) || 'dark'
  );
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
    (localStorage.getItem('colorScheme') as ColorScheme) || 'theme-genesis'
  );
  const [aiMode, setAiModeState] = useState<AIMode>(
    (localStorage.getItem('aiMode') as AIMode) || 'Device'
  );
  const [apiKey, setApiKeyState] = useState<string | null>(
    localStorage.getItem('genesis_v8_api_key')
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [projectToLoad, setProjectToLoad] = useState<Project | null>(null);

  useEffect(() => {
    authService.initDefaultUser();
  }, []);

  useEffect(() => {
    setIsAdmin(user?.email === 'preetjgfilj2@gmail.com');
    setApiKeyState(localStorage.getItem('genesis_v8_api_key'));
  }, [user]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('theme-genesis', 'theme-aurora', 'theme-capcut');
    root.classList.add(colorScheme);
    localStorage.setItem('colorScheme', colorScheme);
  }, [colorScheme]);

  const login = async (email: string, pass: string) => {
    const loggedInUser = await authService.login(email, pass);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const signup = async (email: string, pass: string) => {
    const newUser = await authService.signup(email, pass);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setApiKeyState(null);
    setAiModeState('Device');
  };

  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  const setColorScheme = (newScheme: ColorScheme) => setColorSchemeState(newScheme);
  
  const setAiMode = (mode: AIMode) => {
    setAiModeState(mode);
    localStorage.setItem('aiMode', mode);
  };

  const setApiKey = (key: string) => {
    localStorage.setItem('genesis_v8_api_key', key);
    setApiKeyState(key);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        theme,
        setTheme,
        colorScheme,
        setColorScheme,
        aiMode,
        setAiMode,
        apiKey,
        setApiKey,
        isAdmin,
        projectToLoad,
        setProjectToLoad,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
