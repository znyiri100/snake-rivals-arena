import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, Bomb, User, LogOut, Volume2, VolumeX } from 'lucide-react';
import { useSound } from '@/contexts/SoundContext';
import { api } from '@/services/api';
import { LoginModal } from '@/components/LoginModal';
import { Leaderboard } from '@/components/Leaderboard';
import { toast } from 'sonner';

const Home = () => {
    const { playClick, isMuted, toggleMute } = useSound();
    const [user, setUser] = useState(api.getCurrentUser());
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        const initUser = async () => {
            const u = await api.fetchCurrentUser();
            setUser(u);
        };
        initUser();
    }, []);

    const handleLogout = async () => {
        await api.logout();
        setUser(null);
        toast.success('Logged out successfully');
    };

    const handleLoginSuccess = () => {
        setUser(api.getCurrentUser());
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 flex flex-col">
            {/* Header */}
            <header className="max-w-7xl mx-auto w-full mb-8 flex justify-end items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="text-primary hover:text-primary/90 hover:bg-primary/10"
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-card rounded border border-primary/50">
                            <User className="w-4 h-4 text-secondary" />
                            <div className="flex flex-col">
                                <span className="text-foreground font-semibold">{user.username}</span>
                                <div className="flex items-center gap-1 mt-1">
                                    {user.groups && user.groups.map(g => (
                                        <div key={g.id} className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">{g.name}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 neon-border"
                    >
                        <User className="w-4 h-4 mr-2" />
                        Login / Sign Up
                    </Button>
                )}
            </header>

            <div className="flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto w-full space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-6xl font-bold text-primary neon-text font-orbitron tracking-wider">
                        ARCADE ARENA
                    </h1>
                    <p className="text-xl text-muted-foreground">
                        Select your challenge
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                    <Link to="/snake" onClick={playClick}>
                        <Card className="group relative overflow-hidden p-8 h-80 flex flex-col items-center justify-center gap-6 bg-card/90 border-2 border-primary/50 hover:border-primary transition-all duration-300 hover:scale-105 cursor-pointer neon-border">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <Gamepad2 className="w-24 h-24 text-primary group-hover:text-primary/80 transition-colors duration-300" />
                            <div className="text-center z-10">
                                <h2 className="text-3xl font-bold text-foreground mb-2 font-orbitron">SNAKE</h2>
                                <p className="text-muted-foreground">Classic snake game with a twist</p>
                            </div>
                        </Card>
                    </Link>

                    <Link to="/minesweeper" onClick={playClick}>
                        <Card className="group relative overflow-hidden p-8 h-80 flex flex-col items-center justify-center gap-6 bg-card/90 border-2 border-destructive/50 hover:border-destructive transition-all duration-300 hover:scale-105 cursor-pointer neon-border">
                            <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <Bomb className="w-24 h-24 text-destructive group-hover:text-destructive/80 transition-colors duration-300" />
                            <div className="text-center z-10">
                                <h2 className="text-3xl font-bold text-foreground mb-2 font-orbitron">MINESWEEPER</h2>
                                <p className="text-muted-foreground">Clear the minefield without detonating</p>
                            </div>
                        </Card>
                    </Link>
                </div>

                {/* Leaderboard Section */}
                <div className="w-full max-w-4xl">
                    <Leaderboard user={user} limit={10} title="GLOBAL LEADERBOARD" />
                </div>
            </div>

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
            />
        </div>
    );
};

export default Home;
