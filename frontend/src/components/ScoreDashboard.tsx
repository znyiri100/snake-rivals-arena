
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
    LineChart,
    Line,
    Legend
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Users, Gamepad2, Trophy } from 'lucide-react';

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
    const [activityByMode, setActivityByMode] = useState<any[]>([]);
    const [activityByUser, setActivityByUser] = useState<any[]>([]);
    const [chartType, setChartType] = useState<'line' | 'bar'>('bar');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Load parallel
                const [sumRes, modeRes, userRes] = await Promise.all([
                    api.getStatsSummary(groupId === 'all' ? undefined : groupId),
                    api.getActivityByMode(30, groupId === 'all' ? undefined : groupId),
                    api.getActivityByUser(30, groupId === 'all' ? undefined : groupId)
                ]);

                setSummary(sumRes);
                setActivityByMode(modeRes);
                setActivityByUser(userRes);

            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [groupId]);


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
                <Select value={chartType} onValueChange={(v) => setChartType(v as 'line' | 'bar')}>
                    <SelectTrigger className="w-[140px] h-9 text-xs bg-muted/50 border-border">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="line">Line View</SelectItem>
                        <SelectItem value="bar">Bar View</SelectItem>
                    </SelectContent>
                </Select>
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
                            {chartType === 'line' ? (
                                <LineChart data={activityByMode}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => {
                                            const [year, month, day] = str.split('-').map(Number);
                                            return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                        }}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                        labelFormatter={(str) => {
                                            const [year, month, day] = str.split('-').map(Number);
                                            return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                        }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="snake" name="Snake" stroke="#22c55e" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="minesweeper" name="Minesweeper" stroke="#ef4444" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="space_invaders" name="Space Invaders" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="tetris" name="Tetris" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </LineChart>
                            ) : (
                                <BarChart data={activityByMode}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => {
                                            const [year, month, day] = str.split('-').map(Number);
                                            return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                        }}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                        labelFormatter={(str) => {
                                            const [year, month, day] = str.split('-').map(Number);
                                            return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                        }}
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
                            {chartType === 'line' ? (
                                <LineChart data={activityByUser}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => {
                                            const [year, month, day] = str.split('-').map(Number);
                                            return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                        }}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                        labelFormatter={(str) => {
                                            const [year, month, day] = str.split('-').map(Number);
                                            return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                        }}
                                    />
                                    <Legend />
                                    {activityByUser.length > 0 && Object.keys(activityByUser[0] || {})
                                        .filter(k => k !== 'date')
                                        .map((key, index) => (
                                            <Line
                                                key={key}
                                                type="monotone"
                                                dataKey={key}
                                                stroke={`hsl(${index * 45}, 70%, 50%)`}
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        ))
                                    }
                                </LineChart>
                            ) : (
                                <BarChart data={activityByUser}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => {
                                            const [year, month, day] = str.split('-').map(Number);
                                            return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                        }}
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                        labelFormatter={(str) => {
                                            const [year, month, day] = str.split('-').map(Number);
                                            return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                                        }}
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
