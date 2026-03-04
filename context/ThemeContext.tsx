import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

export const Colors = {
    light: {
        background: '#FFFFFF',
        section: '#F5F5F7',
        card: '#FFFFFF',
        text: '#000000',
        textSecondary: 'rgba(60, 60, 67, 0.6)',
        border: 'rgba(60, 60, 67, 0.1)',
        icon: '#000000',
        activeToggle: '#34C759',
        inactiveToggle: '#E9E9EA',
        profileBg: '#F2F2F7',
        danger: '#FF3B30',
        dangerBg: 'rgba(255, 59, 48, 0.1)',
        dangerBorder: 'rgba(255, 59, 48, 0.2)',
    },
    dark: {
        background: '#161616',
        section: '#161616',
        card: '#1E1E1E',
        text: '#FFFFFF',
        textSecondary: 'rgba(255, 255, 255, 0.5)',
        border: 'rgba(255, 255, 255, 0.05)',
        icon: '#FFFFFF',
        activeToggle: '#4CAF50',
        inactiveToggle: '#333333',
        profileBg: '#1E1E1E',
        danger: '#FF5252',
        dangerBg: 'rgba(255, 82, 82, 0.1)',
        dangerBorder: 'rgba(255, 82, 82, 0.2)',
    }
};

interface ThemeContextType {
    theme: Theme;
    colors: typeof Colors.dark;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<Theme>(systemScheme === 'dark' ? 'dark' : 'light');

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await SecureStore.getItemAsync('user-theme');
                if (savedTheme === 'light' || savedTheme === 'dark') {
                    setThemeState(savedTheme);
                }
            } catch (e) {
                console.log('Failed to load theme', e);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setThemeState(newTheme);
        await SecureStore.setItemAsync('user-theme', newTheme);
    };

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        await SecureStore.setItemAsync('user-theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, colors: Colors[theme], toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useAppTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useAppTheme must be used within an AppThemeProvider');
    }
    return context;
};
