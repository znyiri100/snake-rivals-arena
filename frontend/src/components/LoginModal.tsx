import { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api, type Group } from '@/services/api';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState('');

  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && isSignup) {
      loadGroups();
    }
  }, [isOpen, isSignup]);

  const loadGroups = async () => {
    const groups = await api.getGroups();
    setAvailableGroups(groups);
    // Default to "other" if available and no other selection
    const otherGroup = groups.find(g => g.name === 'other');
    if (otherGroup) {
      setSelectedGroupIds([otherGroup.id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const username = usernameRef.current?.value || '';
    const email = emailRef.current?.value || '';
    const password = passwordRef.current?.value || '';

    try {
      if (isSignup) {
        const result = await api.signup(username, email, password, newGroupName, selectedGroupIds);
        if (result.success) {
          toast.success(`Welcome, ${result.user?.username}!`);
          onLoginSuccess();
          onClose();
          // Form reset happens automatically on next mount or we can manually clear
          setSignupError(null);
        } else {
          // If backend returned a group-specific uniqueness error, show inline guidance
          if (result.error && result.error.includes('already exists in one of the selected groups')) {
            setSignupError('That username or email is already used in one of the groups you selected. Choose a different username/email or select different groups.');
          } else {
            setSignupError(null);
            toast.error(result.error || 'Signup failed');
          }
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

          {isSignup && (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="space-y-2">
                <Label htmlFor="new-group" className="text-foreground">
                  Create New Group (Optional)
                </Label>
                <Input
                  id="new-group"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="bg-input border-border text-foreground"
                  placeholder="Enter new group name"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Join Existing Groups</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-border rounded bg-muted/20">
                  {availableGroups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`group-${group.id}`}
                        checked={selectedGroupIds.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroupIds([...selectedGroupIds, group.id]);
                          } else {
                            setSelectedGroupIds(selectedGroupIds.filter(id => id !== group.id));
                          }
                        }}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor={`group-${group.id}`} className="text-sm font-normal cursor-pointer">
                        {group.name}
                      </Label>
                    </div>
                  ))}
                  {availableGroups.length === 0 && (
                    <div className="text-sm text-muted-foreground col-span-2">No existing groups found</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isSignup && signupError && (
            <div className="text-sm text-destructive mt-2">{signupError}</div>
          )}

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
