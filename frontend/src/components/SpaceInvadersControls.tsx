import { ArrowLeft, ArrowRight, Crosshair, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSound } from '@/contexts/SoundContext';

interface SpaceInvadersControlsProps {
    onMoveLeft: () => void;
    onMoveRight: () => void;
    onShoot: () => void;
    onRestart: () => void;
}

export const SpaceInvadersControls = ({ onMoveLeft, onMoveRight, onShoot, onRestart }: SpaceInvadersControlsProps) => {
    const isMobile = useIsMobile();
    const { playClick } = useSound();

    if (!isMobile) return null;

    const handlePress = (action: () => void) => {
        playClick();
        action();
    };

    return (
        <div className="flex flex-col items-center gap-4 mt-4">
            <div className="flex items-center gap-8">
                <Button
                    variant="outline"
                    size="icon"
                    className="w-16 h-16 rounded-full border-primary/50 bg-background/80 active:bg-primary/20"
                    onClick={() => handlePress(onMoveLeft)}
                >
                    <ArrowLeft className="w-8 h-8 text-primary" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="w-20 h-20 rounded-full border-destructive bg-destructive/10 active:bg-destructive/30"
                    onClick={() => handlePress(onShoot)}
                >
                    <Crosshair className="w-10 h-10 text-destructive" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    className="w-16 h-16 rounded-full border-primary/50 bg-background/80 active:bg-primary/20"
                    onClick={() => handlePress(onMoveRight)}
                >
                    <ArrowRight className="w-8 h-8 text-primary" />
                </Button>
            </div>

            <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-full border-accent text-accent bg-background/80 active:bg-accent/20"
                onClick={() => handlePress(onRestart)}
            >
                <RotateCcw className="w-6 h-6" />
            </Button>
        </div>
    );
};
