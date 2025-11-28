import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const username = usernameRef.current?.value || '';
    const email = emailRef.current?.value || '';
    const password = passwordRef.current?.value || '';

    try {
      if (isSignup) {
        const result = await api.signup(username, email, password);
        if (result.success) {
          toast.success(`Welcome, ${result.user?.username}!`);
          onLoginSuccess();
          onClose();
          // Form reset happens automatically on next mount or we can manually clear
        } else {
          toast.error(result.error || 'Signup failed');
        }
      } else {
        const result = await api.login(email, password);
        if (result.success) {
          toast.success(`Welcome back, ${result.user?.username}!`);
          onLoginSuccess();
          onClose();
        } else {
          toast.error(result.error || 'Login failed');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-2 border-primary/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary neon-text">
            {isSignup ? 'SIGN UP' : 'LOGIN'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                ref={usernameRef}
                required
                className="bg-input border-border text-foreground"
                placeholder="Enter your username"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              ref={emailRef}
              required
              className="bg-input border-border text-foreground"
              placeholder="Enter your email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              ref={passwordRef}
              required
              className="bg-input border-border text-foreground"
              placeholder="Enter your password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-border"
            >
              {isLoading ? 'Processing...' : isSignup ? 'SIGN UP' : 'LOGIN'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={toggleMode}
              className="w-full text-secondary hover:text-secondary/90"
            >
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
