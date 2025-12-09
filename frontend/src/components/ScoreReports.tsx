import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, type User, type Group, type RankedScore, type UserGameModeRank, type OverallRanking } from '@/services/api';
import { Trophy, Medal, Users, TrendingUp, Activity } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreDashboard } from './ScoreDashboard';

interface ScoreReportsProps {
    user?: User | null;
}

type ReportType = 'dashboard' | 'overall' | 'all-scores' | 'best-per-user' | 'top-n';
type GameModeFilter = 'all' | 'snake' | 'minesweeper' | 'space_invaders' | 'tetris';

const GAME_MODE_LABELS: Record<string, string> = {
    snake: '🐍 Snake',
    minesweeper: '💣 Minesweeper',
    space_invaders: '🚀 Space Invaders',
    tetris: '🟦 Tetris'
};

export const ScoreReports = ({ user }: ScoreReportsProps) => {
    const [reportType, setReportType] = useState<ReportType>('dashboard');
    const [gameMode, setGameMode] = useState<GameModeFilter>('all');
    const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
    const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
    const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
    const [topNLimit, setTopNLimit] = useState<number>(10);
    const [sortBy, setSortBy] = useState<'rank' | 'date'>('date');
    const [isLoading, setIsLoading] = useState(true);

    // Data states
    const [allScores, setAllScores] = useState<RankedScore[]>([]);
    const [bestPerUser, setBestPerUser] = useState<UserGameModeRank[]>([]);
    const [topNData, setTopNData] = useState<Record<string, UserGameModeRank[]>>({});
    const [overallRankings, setOverallRankings] = useState<OverallRanking[]>([]);
    const [isNormalized, setIsNormalized] = useState(true);

    // Load available groups
    useEffect(() => {
        const fetchGroups = async () => {
            const groups = await api.getGroups();
            setAvailableGroups(groups);
        };
        fetchGroups();
    }, []);

    // Load data based on report type
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const groupId = selectedGroupId === 'all' ? undefined : selectedGroupId;
                const mode = gameMode === 'all' ? undefined : gameMode;

                switch (reportType) {
                    case 'all-scores':
                        const scores = await api.getAllScoresRanked(mode, groupId, sortBy);
                        setAllScores(scores);
                        break;
                    case 'best-per-user':
                        const best = await api.getBestPerUserPerMode(mode, groupId);
                        setBestPerUser(best);
                        break;
                    case 'top-n':
                        const topN = await api.getTopNPerMode(topNLimit, groupId);
                        setTopNData(topN);
                        break;
                    case 'overall':
                        const overall = await api.getOverallRankings(groupId);
                        setOverallRankings(overall);
                        break;
                }
            } catch (error) {
                console.error('Failed to load report data:', error);
            } finally {
                if (reportType !== 'dashboard') {
                    setIsLoading(false);
                } else {
                    // Dashboard handles its own loading
                    setIsLoading(false);
                }
            }
        };

        loadData();
    }, [reportType, gameMode, selectedGroupId, topNLimit, sortBy]);

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-neon-yellow" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
        if (rank === 3) return <Medal className="w-5 h-5 text-accent" />;
        return null;
    };

    const renderAllScores = () => (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {allScores.map((entry) => (
                <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border hover:border-primary/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 text-center font-bold text-foreground">
                            {getRankIcon(entry.rank) || `#${entry.rank}`}
                        </div>
                        <div>
                            <div className="font-semibold text-foreground">{entry.username}</div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                    {GAME_MODE_LABELS[entry.game_mode] || entry.game_mode}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(entry.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-xl font-bold text-primary neon-text">
                        {entry.score}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderBestPerUser = () => {
        // Filter by selected player if set
        const filteredData = selectedPlayer === 'all'
            ? bestPerUser
            : bestPerUser.filter(entry => entry.username === selectedPlayer);

        // Sort logic
        const sortData = (data: UserGameModeRank[]) => {
            if (sortBy === 'date') {
                return [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            }
            return data;
        };

        const sortedData = sortData(filteredData);

        return (
            <div className="space-y-6">
                {/* Radar Chart for Single Player */}
                {selectedPlayer !== 'all' && (
                    <Card className="p-6 bg-card/50 border-primary/20 mb-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                            <Activity className="w-5 h-5 text-primary" />
                            Performance Radar (Rankings)
                        </h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={
                                    (() => {
                                        const MAX_DOMAIN = Math.max(10, ...filteredData.map(d => d.rank));
                                        return Object.keys(GAME_MODE_LABELS).map(mode => {
                                            const entry = filteredData.find(d => d.game_mode === mode);
                                            const rank = entry ? entry.rank : 0;
                                            return {
                                                subject: GAME_MODE_LABELS[mode],
                                                rank: rank,
                                                // If unranked (0), show 0. Else invert: (1 -> MAX, MAX -> 1)
                                                inverseRank: rank === 0 ? 0 : (MAX_DOMAIN + 1 - rank),
                                                fullMark: MAX_DOMAIN
                                            };
                                        });
                                    })()
                                }>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                                    <PolarRadiusAxis
                                        angle={30}
                                        domain={[0, 'auto']}
                                        tick={{ fill: '#888' }}
                                        // Hide ticks as they are inverted and confusing
                                        tickFormatter={() => ''}
                                    />
                                    <Radar
                                        name={selectedPlayer}
                                        dataKey="inverseRank"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        fillOpacity={0.6}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                                        formatter={(value: number, name: string, props: any) => {
                                            const rank = props.payload.rank;
                                            return rank === 0 ? ['Not Ranked', 'Rank'] : [`#${rank}`, 'Rank'];
                                        }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                )}

                <div className="space-y-2">
                    {sortedData.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded">
                            No data found for this selection.
                        </div>
                    ) : (
                        sortedData.map((entry) => (
                            <div
                                key={`${entry.username}-${entry.game_mode}`}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border hover:border-primary/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 text-center font-bold">
                                        {getRankIcon(entry.rank) || `#${entry.rank}`}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground flex items-center gap-2">
                                            {entry.username}
                                            <Badge variant="outline" className="text-xs font-normal border-primary/20 bg-primary/5">
                                                {GAME_MODE_LABELS[entry.game_mode] || entry.game_mode}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>{entry.games_played} games</span>
                                            <span>•</span>
                                            <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-primary neon-text">
                                    {entry.best_score}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const renderTopN = () => (
        <Tabs defaultValue={Object.keys(topNData)[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                {Object.keys(topNData).map(mode => (
                    <TabsTrigger key={mode} value={mode}>
                        {GAME_MODE_LABELS[mode]?.split(' ')[1] || mode}
                    </TabsTrigger>
                ))}
            </TabsList>
            {Object.entries(topNData).map(([mode, entries]) => (
                <TabsContent key={mode} value={mode} className="space-y-2 mt-4">
                    {entries.map((entry) => (
                        <div
                            key={entry.username}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 text-center font-bold">
                                    {getRankIcon(entry.rank) || `#${entry.rank}`}
                                </div>
                                <div className="font-semibold text-foreground">{entry.username}</div>
                            </div>
                            <div className="text-xl font-bold text-primary neon-text">
                                {entry.best_score}
                            </div>
                        </div>
                    ))}
                </TabsContent>
            ))}
        </Tabs>
    );

    const renderOverallChart = () => {
        // Transform data for Recharts
        const data = overallRankings.map(item => {
            const transformed: any = {
                username: item.username,
                total: item.total_best_scores,
                modes_played: item.modes_played,
                avg_rank: item.avg_rank // Add for sorting
            };

            // Calculate normalized ranks if enabled
            Object.entries(item.mode_ranks).forEach(([mode, rank]) => {
                transformed[mode] = isNormalized ? (rank / item.modes_played) : rank;
                transformed[`${mode}_original`] = rank; // Keep original for tooltip
            });

            return transformed;
        });

        // Sort by average rank ascending (Lowest/Best avg rank first)
        const chartData = data.sort((a, b) => a.avg_rank - b.avg_rank);

        // Get unique game modes from the data or constants
        const gameModes = Object.keys(GAME_MODE_LABELS);
        const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6']; // Neon palette

        const CustomTooltip = ({ active, payload, label }: any) => {
            if (active && payload && payload.length) {
                return (
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 shadow-xl">
                        <p className="font-bold text-foreground mb-2">{label}</p>
                        {payload.map((entry: any) => {
                            const originalRank = entry.payload[`${entry.dataKey}_original`];
                            return (
                                <div key={entry.name} className="flex items-center gap-2 text-xs mb-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-muted-foreground">{entry.name}:</span>
                                    <span className="text-foreground font-mono font-bold">#{originalRank}</span>
                                    {isNormalized && <span className="text-[10px] text-muted-foreground/50">(Norm: {entry.value.toFixed(2)})</span>}
                                </div>
                            );
                        })}
                        <div className="mt-2 pt-2 border-t border-[#333] flex justify-between text-xs">
                            <span className="text-muted-foreground">Games Played:</span>
                            <span className="text-foreground">{payload[0].payload.modes_played}</span>
                        </div>
                    </div>
                );
            }
            return null;
        };

        // Calculate height based on number of users to ensure readability
        const chartHeight = Math.max(400, data.length * 60);

        return (
            <div className="mb-8 p-4 bg-muted/20 rounded-lg border border-border/50">
                <div className="flex justify-end mb-4">
                    <div className="flex items-center space-x-2">
                        <Switch id="normalize-mode" checked={isNormalized} onCheckedChange={setIsNormalized} />
                        <Label htmlFor="normalize-mode" className="text-xs font-medium">Normalize by Games Played</Label>
                    </div>
                </div>
                <div style={{ height: `${chartHeight}px` }} className="w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                            barCategoryGap={20}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                            <XAxis
                                type="number"
                                stroke="#888"
                                tick={{ fill: '#888', fontSize: 12 }}
                                axisLine={{ stroke: '#333' }}
                                label={{
                                    value: isNormalized ? 'Average Rank (Lower is Better)' : 'Sum of Ranks (Lower is Better)',
                                    position: 'insideBottom',
                                    offset: -5,
                                    fill: '#666',
                                    fontSize: 10
                                }}
                            />
                            <YAxis
                                dataKey="username"
                                type="category"
                                stroke="#888"
                                tick={{ fill: '#888', fontSize: 12 }}
                                axisLine={{ stroke: '#333' }}
                                width={90}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            {gameModes.map((mode, index) => (
                                <Bar
                                    key={mode}
                                    dataKey={mode}
                                    stackId="a"
                                    name={GAME_MODE_LABELS[mode]}
                                    fill={colors[index % colors.length]}
                                    radius={index === gameModes.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                                    maxBarSize={40}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const renderOverall = () => (
        <div className="space-y-2 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {/* Chart Section */}
            {overallRankings.length > 0 && renderOverallChart()}

            {/* List Section */}
            {overallRankings.map((entry) => (
                <div
                    key={entry.username}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded border border-border hover:border-primary/50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 text-center font-bold text-foreground">
                            {getRankIcon(entry.overall_rank) || `#${entry.overall_rank}`}
                        </div>
                        <div>
                            <div className="font-semibold text-foreground text-lg">{entry.username}</div>
                            <div className="flex items-center gap-3 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                    {entry.modes_played} {entry.modes_played === 1 ? 'mode' : 'modes'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    Avg Rank: {entry.avg_rank}
                                </span>
                            </div>
                            {/* Mode Ranks */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {Object.entries(entry.mode_ranks || {}).map(([mode, rank]) => (
                                    <Badge key={mode} variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-primary/20 bg-primary/5">
                                        <span className="opacity-70 mr-1">{GAME_MODE_LABELS[mode]?.split(' ')[0] || mode}</span>
                                        <span className="font-bold text-primary">#{rank}</span>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xl font-bold text-primary neon-text">
                            {entry.total_best_scores.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Score</div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <Card className="bg-card/90 border-border p-6">
            {/* Header with controls */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-primary neon-text flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    SCORE REPORTS
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Group selector */}
                    <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                        <SelectTrigger className="w-[140px] h-9 text-xs bg-muted/50 border-border">
                            <div className="flex items-center gap-2">
                                <Users className="w-3 h-3" />
                                <SelectValue placeholder="Select Group" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Groups</SelectItem>
                            {availableGroups.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Game mode filter (for applicable reports) */}
                    {(reportType === 'all-scores' || reportType === 'best-per-user') && (
                        <Select value={gameMode} onValueChange={(v) => setGameMode(v as GameModeFilter)}>
                            <SelectTrigger className="w-[160px] h-9 text-xs bg-muted/50 border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Games</SelectItem>
                                <SelectItem value="snake">🐍 Snake</SelectItem>
                                <SelectItem value="minesweeper">💣 Minesweeper</SelectItem>
                                <SelectItem value="space_invaders">🚀 Space Invaders</SelectItem>
                                <SelectItem value="tetris">🟦 Tetris</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    {/* Player selector for Best Per User (Player) report */}
                    {reportType === 'best-per-user' && (
                        <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                            <SelectTrigger className="w-[140px] h-9 text-xs bg-muted/50 border-border">
                                <div className="flex items-center gap-2">
                                    <Users className="w-3 h-3" />
                                    <SelectValue placeholder="All Players" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Players</SelectItem>
                                {/* Derive unique users from bestPerUser data for now */}
                                {Array.from(new Set(bestPerUser.map(u => u.username))).sort().map(username => (
                                    <SelectItem key={username} value={username}>{username}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Top N selector */}

                    {reportType === 'top-n' && (
                        <Select value={topNLimit.toString()} onValueChange={(v) => setTopNLimit(parseInt(v))}>
                            <SelectTrigger className="w-[100px] h-9 text-xs bg-muted/50 border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">Top 5</SelectItem>
                                <SelectItem value="10">Top 10</SelectItem>
                                <SelectItem value="20">Top 20</SelectItem>
                                <SelectItem value="50">Top 50</SelectItem>
                                <SelectItem value="999">All</SelectItem>
                            </SelectContent>
                        </Select>
                    )}



                    {/* Sort selector for All Scores and Best Per User */}
                    {(reportType === 'all-scores' || reportType === 'best-per-user') && (
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'rank' | 'date')}>
                            <SelectTrigger className="w-[120px] h-9 text-xs bg-muted/50 border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rank">Sort by Rank</SelectItem>
                                <SelectItem value="date">Sort by Date</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Report type selector */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Button
                    variant={reportType === 'dashboard' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportType('dashboard')}
                    className="neon-border"
                >
                    Dashboard
                </Button>
                <Button
                    variant={reportType === 'overall' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportType('overall')}
                >
                    Overall Rankings
                </Button>
                <Button
                    variant={reportType === 'top-n' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportType('top-n')}
                >
                    Top Players
                </Button>
                <Button
                    variant={reportType === 'best-per-user' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportType('best-per-user')}
                >
                    Player
                </Button>
                <Button
                    variant={reportType === 'all-scores' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportType('all-scores')}
                >
                    All Scores
                </Button>
            </div>

            {/* Content */}
            {
                isLoading ? (
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                        ))}
                    </div>
                ) : (
                    <>
                        {reportType === 'dashboard' && <ScoreDashboard groupId={selectedGroupId} />}
                        {reportType === 'all-scores' && renderAllScores()}
                        {reportType === 'best-per-user' && renderBestPerUser()}
                        {reportType === 'top-n' && renderTopN()}
                        {reportType === 'overall' && renderOverall()}
                    </>
                )
            }
        </Card >
    );
};
