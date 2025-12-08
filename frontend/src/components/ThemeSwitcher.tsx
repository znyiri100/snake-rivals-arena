import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { Monitor, Sun, Moon, TreePine, Zap } from "lucide-react";

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="w-[180px] justify-between px-3 border-primary/50 bg-black/50 backdrop-blur-sm">
                    <span className="flex items-center gap-2">
                        {theme === 'retro' && <Monitor className="h-4 w-4 text-neon-green" />}
                        {theme === 'cyberpunk' && <Zap className="h-4 w-4 text-neon-magenta" />}
                        {theme === 'nature' && <TreePine className="h-4 w-4 text-green-500" />}
                        {theme === 'minimalist' && <Moon className="h-4 w-4" />}
                        {theme === 'light' && <Sun className="h-4 w-4 text-yellow-500" />}
                        <span className="capitalize">{theme} Theme</span>
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onClick={() => setTheme("retro")} className="gap-2 cursor-pointer">
                    <Monitor className="h-4 w-4 text-neon-green" />
                    <span>Retro</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("cyberpunk")} className="gap-2 cursor-pointer">
                    <Zap className="h-4 w-4 text-neon-magenta" />
                    <span>Cyberpunk</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("nature")} className="gap-2 cursor-pointer">
                    <TreePine className="h-4 w-4 text-green-500" />
                    <span>Nature</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("minimalist")} className="gap-2 cursor-pointer">
                    <Moon className="h-4 w-4" />
                    <span>Minimalist</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <span>Light</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
