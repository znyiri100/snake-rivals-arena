import React, { createContext, useContext, useState, useEffect } from 'react';
import { soundManager } from '@/utils/sound';

interface SoundContextType {
    isMuted: boolean;
    toggleMute: () => void;
    playEat: () => void;
    playGameOver: () => void;
    playClick: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMuted, setIsMuted] = useState(() => {
        const saved = localStorage.getItem('snake_sound_muted');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('snake_sound_muted', JSON.stringify(isMuted));
    }, [isMuted]);

    const toggleMute = () => setIsMuted((prev: boolean) => !prev);

    const playEat = () => {
        if (!isMuted) soundManager.playEat();
    };

    const playGameOver = () => {
        if (!isMuted) soundManager.playGameOver();
    };

    const playClick = () => {
        if (!isMuted) soundManager.playClick();
    };

    return (
        <SoundContext.Provider value={{ isMuted, toggleMute, playEat, playGameOver, playClick }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (context === undefined) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};
