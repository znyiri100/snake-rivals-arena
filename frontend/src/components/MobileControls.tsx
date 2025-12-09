import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Direction } from '@/utils/gameLogic';
import { useSound } from '@/contexts/SoundContext';

interface MobileControlsProps {
    onDirectionChange: (direction: Direction) => void;
    onRestart: () => void;
}

export const MobileControls = ({ onDirectionChange, onRestart }: MobileControlsProps) => {
    const isMobile = useIsMobile();
    const { playClick } = useSound();

    if (!isMobile) return null;

    const handlePress = (direction: Direction) => {
        playClick();
        onDirectionChange(direction);
    };

    const handleRestart = () => {
        playClick();
        onRestart();
    };

    return (
        <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto mt-4">
            {/* Row 1 */}
            <div />
            <Button
                variant="outline"
                size="icon"
                className="w-16 h-16 rounded-full border-primary/50 bg-background/80 active:bg-primary/20"
                onClick={() => handlePress('UP')}
            >
                <ArrowUp className="w-8 h-8 text-primary" />
            </Button>
            <div />

            {/* Row 2 */}
            <Button
                variant="outline"
                size="icon"
                className="w-16 h-16 rounded-full border-primary/50 bg-background/80 active:bg-primary/20"
                onClick={() => handlePress('LEFT')}
            >
                <ArrowLeft className="w-8 h-8 text-primary" />
            </Button>
            <div />
            <Button
                variant="outline"
                size="icon"
                className="w-16 h-16 rounded-full border-primary/50 bg-background/80 active:bg-primary/20"
                onClick={() => handlePress('RIGHT')}
            >
                <ArrowRight className="w-8 h-8 text-primary" />
            </Button>

            {/* Row 3 */}
            <div />
            <Button
                variant="outline"
                size="icon"
                className="w-16 h-16 rounded-full border-primary/50 bg-background/80 active:bg-primary/20"
                onClick={() => handlePress('DOWN')}
            >
                <ArrowDown className="w-8 h-8 text-primary" />
            </Button>
            <div />
        </div>
    );
};
