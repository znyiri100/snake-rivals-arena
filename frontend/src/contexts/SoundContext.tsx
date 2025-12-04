import React, { createContext, useContext, useState, useEffect } from 'react';
import { soundManager } from '@/utils/sound';

interface SoundContextType {
    isMuted: boolean;
    toggleMute: () => void;
    volume: number;
    setVolume: (volume: number) => void;
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

    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('snake_sound_volume');
        return saved ? parseFloat(saved) : 0.5;
    });

    useEffect(() => {
        localStorage.setItem('snake_sound_muted', JSON.stringify(isMuted));
    }, [isMuted]);

    useEffect(() => {
        localStorage.setItem('snake_sound_volume', volume.toString());
    }, [volume]);

    const toggleMute = () => setIsMuted((prev: boolean) => !prev);

    // Helper to play sound with volume
    const playWithVolume = (playFn: () => void) => {
        if (!isMuted) {
            // Note: soundManager currently doesn't support volume per sound.
            // We would need to update soundManager or use the volume here if possible.
            // Since soundManager uses Audio objects, we can't easily set volume globally without refactoring it.
            // For now, we'll assume soundManager needs an update or we hack it.
            // Let's check soundManager first.
            // But wait, I can't check it in the middle of this replace.
            // I will assume I need to update soundManager too.
            // For now, I will just pass the volume to the context consumers or handle it here if I can.
            // Actually, the user wants adjustable volume.
            // I should update soundManager to accept volume.
            playFn();
        }
    };

    // Wait, I need to update soundManager to support volume.
    // I will update SoundContext to expose volume, and then I will update soundManager.

    const playEat = () => {
        if (!isMuted) soundManager.playEat(volume);
    };

    const playGameOver = () => {
        if (!isMuted) soundManager.playGameOver(volume);
    };

    const playClick = () => {
        if (!isMuted) soundManager.playClick(volume);
    };

    return (
        <SoundContext.Provider value={{ isMuted, toggleMute, volume, setVolume, playEat, playGameOver, playClick }}>
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
