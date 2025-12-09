import { Flag, Pickaxe, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSound } from '@/contexts/SoundContext';

interface MinesweeperControlsProps {
    isFlagMode: boolean;
    onToggleMode: () => void;
    onRestart: () => void;
}

export const MinesweeperControls = ({ isFlagMode, onToggleMode, onRestart }: MinesweeperControlsProps) => {
    const isMobile = useIsMobile();
    const { playClick } = useSound();

    if (!isMobile) return null;

    const handleToggle = () => {
        playClick();
        onToggleMode();
    };

    const handleRestart = () => {
        playClick();
        onRestart();
    };

    return (
        <div className="flex justify-center gap-4 mt-4">
            <Button
                variant={isFlagMode ? "default" : "outline"}
                size="lg"
                className={`w-32 h-16 rounded-full border-2 ${isFlagMode
                        ? 'bg-destructive hover:bg-destructive/90 border-destructive'
                        : 'bg-background/80 border-primary/50'
                    }`}
                onClick={handleToggle}
            >
                {isFlagMode ? (
                    <>
                        <Flag className="w-8 h-8 mr-2" />
                        FLAG
                    </>
                ) : (
                    <>
                        <Pickaxe className="w-8 h-8 mr-2 text-primary" />
                        DIG
                    </>
                )}
            </Button>

            <Button
                variant="outline"
                size="icon"
                className="w-16 h-16 rounded-full border-2 border-accent text-accent bg-background/80 active:bg-accent/20"
                onClick={handleRestart}
            >
                <RotateCcw className="w-8 h-8" />
            </Button>
        </div>
    );
};
