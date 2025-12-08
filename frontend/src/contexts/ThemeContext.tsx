import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'retro' | 'cyberpunk' | 'nature' | 'minimalist' | 'light';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check localStorage first
        const saved = localStorage.getItem('theme');
        // Default to retro if no saved theme or invalid theme
        if (saved && ['retro', 'cyberpunk', 'nature', 'minimalist', 'light'].includes(saved)) {
            return saved as Theme;
        }
        return 'retro';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove all previous theme classes
        root.classList.remove('theme-retro', 'theme-cyberpunk', 'theme-nature', 'theme-minimalist', 'theme-light');

        // Add new theme class
        root.classList.add(`theme-${theme}`);

        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
