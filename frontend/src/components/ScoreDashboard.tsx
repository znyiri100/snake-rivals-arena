
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { api } from '@/services/api';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Legend
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Users, Gamepad2, Trophy, Info } from 'lucide-react';

interface ScoreDashboardProps {
    groupId: string;
}

const GAME_MODE_LABELS: Record<string, string> = {
    snake: '🐍 Snake',
    minesweeper: '💣 Minesweeper',
    space_invaders: '🚀 Space Invaders',
    tetris: '🟦 Tetris'
};

export const ScoreDashboard = ({ groupId }: ScoreDashboardProps) => {
    const [summary, setSummary] = useState({ total_games: 0, total_players: 0, recent_games: 0, popular_mode: 'None' });
    const [distribution, setDistribution] = useState<{ range: string; count: number }[]>([]);
    const [activity, setActivity] = useState<{ date: string; games: number }[]>([]);
    const [activityByMode, setActivityByMode] = useState<any[]>([]);
    const [activityByUser, setActivityByUser] = useState<any[]>([]);
    const [selectedMode, setSelectedMode] = useState<string>('snake');
    const [chartType, setChartType] = useState<'area' | 'bar'>('area');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Load parallel
                const [sumRes, actRes, modeRes, userRes] = await Promise.all([
                    api.getStatsSummary(groupId === 'all' ? undefined : groupId),
                    api.getActivityTrends(30, groupId === 'all' ? undefined : groupId),
                    api.getActivityByMode(30, groupId === 'all' ? undefined : groupId),
                    api.getActivityByUser(30, groupId === 'all' ? undefined : groupId)
                ]);

                setSummary(sumRes);
                setActivity(actRes);
                setActivityByMode(modeRes);
                setActivityByUser(userRes);

                // Load distribution separately as it depends on mode
                await loadDistribution(selectedMode);

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [groupId]);

    const loadDistribution = async (mode: string) => {
        const dist = await api.getScoreDistribution(mode, groupId === 'all' ? undefined : groupId);
        setDistribution(dist);
    };

    // Update distribution when mode changes
    useEffect(() => {
        loadDistribution(selectedMode);
    }, [selectedMode, groupId]);

    if (isLoading) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading dashboard insights...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-card/50 border-primary/20 hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Gamepad2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total Games</div>
                            <div className="text-2xl font-bold neon-text">{summary.total_games.toLocaleString()}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-card/50 border-primary/20 hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Users className="w-5 h-5 text-neon-blue" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Total Players</div>
                            <div className="text-2xl font-bold text-neon-blue">{summary.total_players.toLocaleString()}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-card/50 border-primary/20 hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Activity className="w-5 h-5 text-neon-green" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">24h Activity</div>
                            <div className="text-2xl font-bold text-neon-green">{summary.recent_games.toLocaleString()}</div>
                        </div>
                    </div>
                </Card>
                <Card className="p-4 bg-card/50 border-primary/20 hover:border-primary/50 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Trophy className="w-5 h-5 text-neon-yellow" />
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Popular Mode</div>
                            <div className="text-xl font-bold text-neon-yellow truncate max-w-[120px]" title={summary.popular_mode === 'None' ? 'None' : GAME_MODE_LABELS[summary.popular_mode] || summary.popular_mode}>
                                {summary.popular_mode === 'None' ? 'None' : GAME_MODE_LABELS[summary.popular_mode] || summary.popular_mode}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex justify-end mb-4">
                <Select value={chartType} onValueChange={(v) => setChartType(v as 'area' | 'bar')}>
                    <SelectTrigger className="w-[140px] h-9 text-xs bg-muted/50 border-border">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="area">Area View</SelectItem>
                        <SelectItem value="bar">Bar View</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Activity Trends Chart */}
                <Card className="p-6 bg-card/80 border-border">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                        <Activity className="w-5 h-5 text-primary" />
                        Activity Trends (Last 30 Days)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activity}>
                                <defs>
                                    <linearGradient id="colorGames" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="games"
                                    stroke="hsl(var(--primary))"
                                    fillOpacity={1}
                                    fill="url(#colorGames)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Score Distribution Chart */}
                <Card className="p-6 bg-card/80 border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                            <Info className="w-5 h-5 text-primary" />
                            Score Distribution
                        </h3>
                        <Select value={selectedMode} onValueChange={setSelectedMode}>
                            <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="snake">🐍 Snake</SelectItem>
                                <SelectItem value="minesweeper">💣 Minesweeper</SelectItem>
                                <SelectItem value="space_invaders">🚀 Space Invaders</SelectItem>
                                <SelectItem value="tetris">🟦 Tetris</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="h-[300px] w-full">
                        {distribution.length > 0 && distribution.every(d => d.count === 0) ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                No data available for this mode
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={distribution}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="range"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={10}
                                        interval={0}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Activity by Game Mode */}
                <Card className="p-6 bg-card/80 border-border">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                        <Gamepad2 className="w-5 h-5 text-primary" />
                        Activity by Game Mode
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'area' ? (
                                <AreaChart data={activityByMode}>
                                    <defs>
                                        <linearGradient id="colorSnake" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorMines" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorSpace" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorTetris" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="snake" name="Snake" stackId="1" stroke="#22c55e" fill="url(#colorSnake)" />
                                    <Area type="monotone" dataKey="minesweeper" name="Minesweeper" stackId="1" stroke="#ef4444" fill="url(#colorMines)" />
                                    <Area type="monotone" dataKey="space_invaders" name="Space Invaders" stackId="1" stroke="#8b5cf6" fill="url(#colorSpace)" />
                                    <Area type="monotone" dataKey="tetris" name="Tetris" stackId="1" stroke="#3b82f6" fill="url(#colorTetris)" />
                                </AreaChart>
                            ) : (
                                <BarChart data={activityByMode}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="snake" name="Snake" stackId="1" fill="#22c55e" />
                                    <Bar dataKey="minesweeper" name="Minesweeper" stackId="1" fill="#ef4444" />
                                    <Bar dataKey="space_invaders" name="Space Invaders" stackId="1" fill="#8b5cf6" />
                                    <Bar dataKey="tetris" name="Tetris" stackId="1" fill="#3b82f6" />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Activity by User */}
                <Card className="p-6 bg-card/80 border-border">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                        <Users className="w-5 h-5 text-primary" />
                        Activity by User (Top 10)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'area' ? (
                                <AreaChart data={activityByUser}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend />
                                    {activityByUser.length > 0 && Object.keys(activityByUser[0] || {})
                                        .filter(k => k !== 'date')
                                        .map((key, index) => (
                                            <Area
                                                key={key}
                                                type="monotone"
                                                dataKey={key}
                                                stackId="1"
                                                stroke={`hsl(${index * 45}, 70%, 50%)`}
                                                fill={`hsl(${index * 45}, 70%, 50%)`}
                                                fillOpacity={0.6}
                                            />
                                        ))
                                    }
                                </AreaChart>
                            ) : (
                                <BarChart data={activityByUser}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend />
                                    {activityByUser.length > 0 && Object.keys(activityByUser[0] || {})
                                        .filter(k => k !== 'date')
                                        .map((key, index) => (
                                            <Bar
                                                key={key}
                                                dataKey={key}
                                                stackId="1"
                                                fill={`hsl(${index * 45}, 70%, 50%)`}
                                            />
                                        ))
                                    }
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};
