import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Pause, Play, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSound } from '@/contexts/SoundContext';

interface TetrisControlsProps {
    onMoveLeft: () => void;
    onMoveRight: () => void;
    onSoftDrop: () => void;
    onRotate: () => void;
    onHardDrop: () => void;
    onPause: () => void;
    onRestart: () => void;
    isPaused: boolean;
}

export const TetrisControls = ({
    onMoveLeft,
    onMoveRight,
    onSoftDrop,
    onRotate,
    onHardDrop,
    onPause,
    onRestart,
    isPaused
}: TetrisControlsProps) => {
    const isMobile = useIsMobile();
    const { playClick } = useSound();

    if (!isMobile) return null;

    const handlePress = (action: () => void) => {
        playClick();
        action();
    };

    return (
        <div className="flex flex-col items-center gap-4 mt-6">
            <div className="flex items-end gap-8">
                {/* D-Pad */}
                <div className="grid grid-cols-3 gap-2">
                    <div />
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-14 h-14 rounded-full border-primary/50 bg-background/80 active:bg-primary/20"
                        onClick={() => handlePress(onRotate)}
                    >
                        <ArrowUp className="w-8 h-8 text-primary" />
                    </Button>
                    <div />

                    <Button
                        variant="outline"
                        size="icon"
                        className="w-14 h-14 rounded-full border-primary/50 bg-background/80 active:bg-primary/20"
                        onClick={() => handlePress(onMoveLeft)}
                    >
                        <ArrowLeft className="w-8 h-8 text-primary" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-14 h-14 rounded-full border-primary/50 bg-background/80 active:bg-primary/20"
                        onClick={() => handlePress(onSoftDrop)}
                    >
                        <ArrowDown className="w-8 h-8 text-primary" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-14 h-14 rounded-full border-primary/50 bg-background/80 active:bg-primary/20"
                        onClick={() => handlePress(onMoveRight)}
                    >
                        <ArrowRight className="w-8 h-8 text-primary" />
                    </Button>
                </div>

                {/* Hard Drop Button */}
                <div className="flex flex-col items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-20 h-20 rounded-full border-accent bg-accent/10 active:bg-accent/30 mb-2"
                        onClick={() => handlePress(onHardDrop)}
                    >
                        <Download className="w-10 h-10 text-accent" />
                    </Button>
                    <span className="text-xs text-muted-foreground font-bold">DROP</span>
                </div>
            </div>

            {/* Utility Buttons */}
            <div className="flex gap-4 mt-2">
                <Button
                    variant="outline"
                    className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                    onClick={() => handlePress(onPause)}
                >
                    {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                    {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handlePress(onRestart)}
                >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restart
                </Button>
            </div>
        </div>
    );
};
