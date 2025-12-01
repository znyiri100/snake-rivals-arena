import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, type LeaderboardEntry, type Group, type User } from '@/services/api';
import { Trophy, Medal, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeaderboardProps {
  gameMode?: 'passthrough' | 'walls';
  limit?: number;
  title?: string;
  user?: User | null;
}

export const Leaderboard = ({
  gameMode,
  limit = 100,
  title = "High achievers",
  user
}: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [userGroups, setUserGroups] = useState<Group[]>([]);

  // We need to re-check the user when the component mounts OR when the user logs in/out.
  // Since we don't have a global user context passed down here easily without refactoring everything,
  // we can poll or use an event. But actually, Index.tsx re-renders when user changes.
  // However, Leaderboard is a child. If Index re-renders, Leaderboard re-renders.
  // But the useEffect [] only runs on mount.
  // We should remove the dependency array or add a dependency that changes when user changes.
  // But we don't have 'user' prop.

  // Better approach: Check api.getCurrentUser() in a useEffect that runs periodically or we add a 'key' to Leaderboard in parent.
  // OR we just fetch user every time we load leaderboard? No, that's wasteful.

  // Let's change the useEffect to run when we want to refresh user info.
  // Actually, let's just fetch the user info every time we mount, AND expose a way to refresh.
  // But the issue is when user logs in, Leaderboard is ALREADY mounted (in the sidebar).

  // Let's add a custom event listener for login/logout in api.ts? No, that's complex.
  // Let's just use a simple interval or check on focus?

  // Simplest fix: Pass 'user' as a prop to Leaderboard.
  // Index.tsx has 'user' state.

  // But I can't change the interface easily without updating all usages.
  // Usages: Index.tsx (2 places).

  // Let's update the interface.

  // Wait, I can't do that in this tool call easily if I want to be safe.
  // Let's try to just fix the useEffect to depend on something.

  // Actually, api.getCurrentUser() returns the cached user.
  // If I add a polling interval?

  // No, let's just add `user` prop. It's the clean way.
  // I will update Leaderboard.tsx first to accept optional user prop.

  // Wait, I am in multi_replace_file_content for Leaderboard.tsx.
  // I will add `user?: User | null` to props.


  useEffect(() => {
    // If user prop is provided, use it. Otherwise try to get from api (fallback)
    const currentUser = user || api.getCurrentUser();

    if (currentUser && currentUser.groups && currentUser.groups.length > 0) {
      setUserGroups(currentUser.groups);
      // Only set default if we are currently on 'all' or the current selection is invalid
      // Actually, if the user changes, we probably want to switch to their primary group?
      // Or if we just logged in.

      // If selectedGroupId is 'all', switch to first group.
      // If selectedGroupId is not in the new user's groups, switch to first group.

      const isCurrentSelectionValid = currentUser.groups.some(g => g.id === selectedGroupId);

      if (selectedGroupId === 'all' || !isCurrentSelectionValid) {
        setSelectedGroupId(currentUser.groups[0].id);
      }
    } else {
      // User logged out or has no groups
      setUserGroups([]);
      setSelectedGroupId('all');
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadLeaderboard = async () => {
      setIsLoading(true);
      try {
        const groupId = selectedGroupId === 'all' ? undefined : selectedGroupId;
        const data = await api.getLeaderboard(gameMode, groupId);
        if (active) {
          setEntries(data.slice(0, limit));
        }
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        if (active) {
          setError('Failed to load leaderboard data');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      active = false;
    };
  }, [gameMode, selectedGroupId]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-neon-yellow" />;
    if (index === 1) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (index === 2) return <Medal className="w-5 h-5 text-accent" />;
    return null;
  };

  return (
    <Card className="bg-card/90 border-border p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-primary neon-text flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          {title}
        </h2>

        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/50 border-border">
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3" />
              <SelectValue placeholder="Select Group" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {userGroups.map(group => (
              <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-4 bg-red-500/10 rounded border border-red-500/50">
          {error}
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 text-center font-bold text-foreground">
                  {getRankIcon(index) || `#${index + 1}`}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{entry.username}</div>
                  <Badge variant="outline" className="text-xs">
                    {entry.gameMode}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-primary neon-text">
                  {entry.score}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
