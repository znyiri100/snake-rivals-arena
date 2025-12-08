import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SnakeGame from "./pages/SnakeGame";
import Minesweeper from "./pages/Minesweeper";
import SpaceInvaders from "./pages/SpaceInvaders";
import Tetris from "./pages/Tetris";
import NotFound from "./pages/NotFound";
import { SoundProvider } from "./contexts/SoundContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeSwitcher } from "./components/ThemeSwitcher";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SoundProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="fixed top-4 right-4 z-50">
              <ThemeSwitcher />
            </div>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/snake" element={<SnakeGame />} />
              <Route path="/minesweeper" element={<Minesweeper />} />
              <Route path="/space-invaders" element={<SpaceInvaders />} />
              <Route path="/tetris" element={<Tetris />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </SoundProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
