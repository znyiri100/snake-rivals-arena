import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, type User, type Group, type RankedScore, type UserGameModeRank, type OverallRanking } from '@/services/api';
import { Trophy, Medal, Users, TrendingUp, Activity, Check, ChevronsUpDown, Info } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

const PLAYER_COLORS = [
    '#2563eb', // blue-600
    '#dc2626', // red-600
    '#16a34a', // green-600
    '#d97706', // amber-600
    '#9333ea', // purple-600
    '#0891b2', // cyan-600
    '#ea580c', // orange-600
];

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
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
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
    const [playerChartType, setPlayerChartType] = useState<'radar' | 'bar'>('radar');
    const [isSkillsNormalized, setIsSkillsNormalized] = useState(false);

    // New states for relocated Dashboard graphs
    const [distribution, setDistribution] = useState<{ range: string; count: number }[]>([]);
    const [topScores, setTopScores] = useState<any[]>([]);
    const [overallSelectedMode, setOverallSelectedMode] = useState<string>('snake');

    // Filters for "All Scores"
    const [selectedPlayerForScores, setSelectedPlayerForScores] = useState<string>('');
    const [playerSearchOpen, setPlayerSearchOpen] = useState(false);

    // Load available groups
    useEffect(() => {
        const fetchGroups = async () => {
            const groups = await api.getGroups();
            setAvailableGroups(groups);
        };
        fetchGroups();
    }, []);

    const loadModeSpecificData = async (mode: string, groupId: string) => {
        const [dist, top] = await Promise.all([
            api.getScoreDistribution(mode, groupId === 'all' ? undefined : groupId),
            api.getTopNPerMode(5, groupId === 'all' ? undefined : groupId)
        ]);
        setDistribution(dist);
        const modeData = (top as any)[mode] || [];
        setTopScores(modeData);
    };

    // Load data based on report type
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const groupId = selectedGroupId === 'all' ? undefined : selectedGroupId;
                const mode = gameMode === 'all' ? undefined : gameMode;

                switch (reportType) {
                    case 'all-scores':
                        const scores = await api.getAllScoresRanked(mode, groupId, sortBy, selectedPlayerForScores || undefined);
                        setAllScores(scores);
                        break;
                    case 'best-per-user':
                        // Fetch best scores, all scores, and overall rankings (to find the top player)
                        const [best, all, overallData] = await Promise.all([
                            api.getBestPerUserPerMode(mode, groupId),
                            api.getAllScoresRanked(mode, groupId, sortBy),
                            api.getOverallRankings(groupId)
                        ]);
                        setBestPerUser(best);
                        setAllScores(all);
                        setOverallRankings(overallData);

                        // Default to top player if none selected and rankings are available
                        if (selectedPlayers.length === 0 && overallData.length > 0) {
                            setSelectedPlayers([overallData[0].username]);
                        }
                        break;
                    case 'top-n':
                        const topN = await api.getTopNPerMode(topNLimit, groupId);
                        setTopNData(topN);
                        await loadModeSpecificData(overallSelectedMode, selectedGroupId);
                        break;
                    case 'overall':
                        const overall = await api.getOverallRankings(groupId);
                        setOverallRankings(overall);
                        break;
                }
            } catch (error) {
                console.error('Failed to load report data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [reportType, gameMode, selectedGroupId, sortBy, topNLimit, selectedPlayerForScores]);

    // Re-fetch distribution when mode changes in Top Players report
    useEffect(() => {
        if (reportType === 'top-n') {
            loadModeSpecificData(overallSelectedMode, selectedGroupId);
        }
    }, [overallSelectedMode, reportType, selectedGroupId]);

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
                                    {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
        // Filter by selected players if list is not empty
        const filteredBestData = selectedPlayers.length === 0
            ? bestPerUser
            : bestPerUser.filter(entry => selectedPlayers.includes(entry.username));

        const filteredHistoryData = selectedPlayers.length === 0
            ? allScores
            : allScores.filter(entry => selectedPlayers.includes(entry.username));

        // Average rank for display (averaged across selected players)
        const selectedOverallStats = overallRankings.filter(r => selectedPlayers.includes(r.username));
        const avgRankDisplay = selectedOverallStats.length === 1
            ? selectedOverallStats[0].avg_rank
            : (selectedOverallStats.reduce((sum, r) => sum + r.avg_rank, 0) / (selectedOverallStats.length || 1)).toFixed(2);

        // Derive Chart Data for comparison
        // We need a single array where each object is {mode: string, label: string, [player_username]: rank }
        // For normalization: we use Rank / ModesPlayed. Lower is better.
        // For standard: we use Rank. Lower is better.

        // Calculate max value for Radar domain if normalized
        let maxNormalizedValue = 0;

        const chartData = Object.keys(GAME_MODE_LABELS).map(mode => {
            const dataPoint: any = {
                mode: mode,
                label: mode.replace('_', ' ').toUpperCase(),
            };

            selectedPlayers.forEach(username => {
                const entry = bestPerUser.find(d => d.username === username && d.game_mode === mode);
                const rank = entry ? entry.rank : 0;
                const games = entry ? entry.games_played : 0;

                let val: number | null = null;
                let radarVal = 0;

                const playerOverall = selectedOverallStats.find(p => p.username === username);
                const modesPlayed = playerOverall ? playerOverall.modes_played : 1;

                if (rank > 0) {
                    if (isSkillsNormalized) {
                        // Normalize by Number of Game Types Played (Modes Played)
                        val = rank / modesPlayed;
                        // Radar Inversion: Max (5) - val. 
                        radarVal = Math.max(0, 5 - val);
                    } else {
                        val = rank;
                        // Radar Inversion: 6 - rank (1->5, 5->1).
                        radarVal = 6 - val;
                    }
                } else {
                    radarVal = 0;
                }

                dataPoint[`rank_${username}`] = val;
                dataPoint[`radar_${username}`] = radarVal;
                dataPoint[`original_rank_${username}`] = rank;
                dataPoint[`games_${username}`] = games;
            });

            return dataPoint;
        });

        // Sort logic for history
        const sortData = (data: RankedScore[]) => {
            if (sortBy === 'date') {
                return [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            }
            return data;
        };

        const sortedHistory = sortData(filteredHistoryData);

        return (
            <div className="space-y-6">
                {/* Charts Area */}
                {selectedPlayers.length > 0 && (
                    <Card className="p-6 bg-card/50 border-primary/20 mb-6">
                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-foreground">
                                {selectedPlayers.length === 1 ? `Performance Profile (Lower is Better #1): ${selectedPlayers[0]}` : 'Player Comparison (Lower is Better #1)'}
                            </h3>
                        </div>

                        {/* Rank Table */}
                        <div className="mb-4 border-b border-border pb-6 overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-2 font-bold text-muted-foreground">Player</th>
                                        {Object.keys(GAME_MODE_LABELS).map(mode => (
                                            <th key={mode} className="text-center py-2 font-bold text-muted-foreground">
                                                {GAME_MODE_LABELS[mode]?.split(' ')[1] || mode}
                                            </th>
                                        ))}
                                        <th className="text-right py-2 font-bold text-muted-foreground">Avg Rank</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedPlayers.map((username, pIndex) => {
                                        const playerStats = overallRankings.find(r => r.username === username);
                                        return (
                                            <tr key={username} className="border-b border-border/50 hover:bg-muted/30">
                                                <td className="py-3 font-semibold text-foreground flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PLAYER_COLORS[pIndex % PLAYER_COLORS.length] }} />
                                                    {username}
                                                </td>
                                                {Object.keys(GAME_MODE_LABELS).map(mode => {
                                                    const entry = bestPerUser.find(d => d.username === username && d.game_mode === mode);
                                                    return (
                                                        <td key={mode} className="text-center py-3">
                                                            {entry ? (
                                                                <span className={cn(
                                                                    "font-bold",
                                                                    entry.rank === 1 ? "text-neon-yellow" :
                                                                        entry.rank === 2 ? "text-muted-foreground" :
                                                                            entry.rank === 3 ? "text-accent" : "text-foreground"
                                                                )}>
                                                                    #{entry.rank}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="text-right py-3 font-bold text-primary">
                                                    {playerStats?.avg_rank || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between mb-4 gap-4">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground">
                                <Activity className="w-4 h-4 text-primary" />
                                SKILL ANALYSIS
                            </h3>
                            <div className="flex items-center space-x-2">
                                <Switch id="normalize-skills" checked={isSkillsNormalized} onCheckedChange={setIsSkillsNormalized} />
                                <Label htmlFor="normalize-skills" className="text-xs font-medium">Normalize by Games Played</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-muted/50 p-1 rounded-lg border border-border">
                                <Button
                                    variant={playerChartType === 'radar' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setPlayerChartType('radar')}
                                    className="h-7 text-xs"
                                >
                                    Radar
                                </Button>
                                <Button
                                    variant={playerChartType === 'bar' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setPlayerChartType('bar')}
                                    className="h-7 text-xs"
                                >
                                    Bar
                                </Button>
                            </div>
                        </div>

                        <div className="h-[650px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                {playerChartType === 'radar' ? (
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                        <PolarGrid gridType="circle" stroke="#444" />
                                        <PolarAngleAxis dataKey="label" tick={{ fill: '#aaa', fontSize: 16, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis
                                            angle={0}
                                            domain={[0, 5]}
                                            tickCount={6}
                                            tickFormatter={(val) => isSkillsNormalized
                                                ? (5 - val).toFixed(1)
                                                : (val === 0 ? '' : (6 - val).toString())}
                                            tick={{ fill: '#666', fontSize: 11 }}
                                            axisLine={false}
                                        />
                                        <PolarRadiusAxis
                                            angle={90}
                                            domain={[0, 5]}
                                            tickCount={6}
                                            tickFormatter={() => ''}
                                            tick={{ fill: '#666', fontSize: 11 }}
                                            axisLine={false}
                                        />
                                        <PolarRadiusAxis
                                            angle={180}
                                            domain={[0, 5]}
                                            tickCount={6}
                                            tickFormatter={() => ''}
                                            tick={{ fill: '#666', fontSize: 11 }}
                                            axisLine={false}
                                        />
                                        <PolarRadiusAxis
                                            angle={270}
                                            domain={[0, 5]}
                                            tickCount={6}
                                            tickFormatter={() => ''}
                                            tick={{ fill: '#666', fontSize: 11 }}
                                            axisLine={false}
                                        />
                                        {selectedPlayers.map((username, index) => (
                                            <Radar
                                                key={username}
                                                name={username}
                                                dataKey={`radar_${username}`}
                                                stroke={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                                                fill={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                                                fillOpacity={0.2}
                                                strokeWidth={3}
                                            />
                                        ))}
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                                            formatter={(value: any, name: string, props: any) => {
                                                const originalRank = props.payload[`original_rank_${name}`];
                                                const games = props.payload[`games_${name}`];
                                                // Get the actual normalized value (rank / modes) for display
                                                const normalizedRank = props.payload[`rank_${name}`];

                                                const rankText = originalRank === 0 ? 'Not Ranked' : `#${originalRank}`;
                                                return [
                                                    isSkillsNormalized
                                                        ? `${Number(normalizedRank).toFixed(2)} (Rank/Modes)`
                                                        : rankText,
                                                    `${name} (${games} games)`
                                                ];
                                            }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </RadarChart>
                                ) : (
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis dataKey="label" stroke="#888" tick={{ fill: '#888', fontSize: 14 }} />
                                        <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 14 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333', color: '#fff' }}
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                        />
                                        <Legend />
                                        {selectedPlayers.map((username, index) => (
                                            <Bar
                                                key={username}
                                                dataKey={`rank_${username}`}
                                                name={username}
                                                fill={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                                                radius={[4, 4, 0, 0]}
                                            />
                                        ))}
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </Card>
                )}

                <div className="space-y-2">
                    {/* Header for List */}
                    <div className="flex items-center justify-between text-sm text-foreground mb-2 px-2">
                        <span className="font-bold">Match History ({sortedHistory.length})</span>
                    </div>

                    {sortedHistory.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded">
                            No games played yet.
                        </div>
                    ) : (
                        <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {sortedHistory.map((entry) => (
                                <div
                                    key={entry.id}
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
                                                <span>{new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-primary neon-text">
                                        {entry.score}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderTopN = () => (
        <div className="space-y-6">
            {/* Score Distribution and Top Leaders Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card className="p-6 bg-card/80 border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                            <Info className="w-5 h-5 text-primary" />
                            Score Distribution
                        </h3>
                        <Select value={overallSelectedMode} onValueChange={setOverallSelectedMode}>
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
                    <div className="h-[250px] w-full">
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

                <Card className="p-6 bg-card/80 border-border">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                        <Trophy className="w-5 h-5 text-neon-yellow" />
                        Top 5 Leaders ({GAME_MODE_LABELS[overallSelectedMode] || overallSelectedMode})
                    </h3>
                    <div className="space-y-3">
                        {topScores.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">
                                No scores yet for this mode.
                            </div>
                        ) : (
                            topScores.map((score, index) => (
                                <div key={score.username} className="flex items-center justify-between p-3 bg-muted/30 rounded border border-border/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                                            ${index === 0 ? 'bg-neon-yellow/20 text-neon-yellow' :
                                                index === 1 ? 'bg-muted-foreground/20 text-muted-foreground' :
                                                    index === 2 ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}
                                        `}>
                                            {index + 1}
                                        </div>
                                        <span className="font-semibold">{score.username}</span>
                                    </div>
                                    <span className="font-mono font-bold text-primary">{score.best_score.toLocaleString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Detailed Rankings (Top {topNLimit})
                </h3>
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
            </div>
        </div>
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
            <div className="space-y-2">
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
        </div>
    );

    return (
        <Card className="bg-card/90 border-border p-6">
            {/* Header with report type buttons */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-primary neon-text flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    SCORE REPORTS
                </h2>

                {/* Report type selector */}
                <div className="flex flex-wrap gap-2">
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
                        Player Skills
                    </Button>
                    <Button
                        variant={reportType === 'all-scores' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setReportType('all-scores')}
                    >
                        All Scores
                    </Button>
                </div>
            </div>

            {/* Filtering controls */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Player multi-selector */}
                {reportType === 'best-per-user' && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-[200px] justify-between h-9 text-xs bg-muted/50 border-border"
                            >
                                <div className="flex items-center gap-2 overflow-hidden overflow-ellipsis">
                                    <Users className="w-3 h-3" />
                                    {selectedPlayers.length === 0 ? "Select Players" :
                                        selectedPlayers.length === 1 ? selectedPlayers[0] :
                                            `${selectedPlayers.length} players selected`}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                            <Command>
                                <CommandInput placeholder="Search player..." />
                                <CommandList>
                                    <CommandEmpty>No player found.</CommandEmpty>
                                    <CommandGroup title="Players">
                                        {Array.from(new Set(bestPerUser.map(u => u.username))).sort().map((player) => (
                                            <CommandItem
                                                key={player}
                                                onSelect={() => {
                                                    setSelectedPlayers(prev =>
                                                        prev.includes(player)
                                                            ? prev.filter(p => p !== player)
                                                            : [...prev, player]
                                                    );
                                                }}
                                            >
                                                <div className="flex items-center gap-2 w-full">
                                                    <Checkbox
                                                        checked={selectedPlayers.includes(player)}
                                                        className="pointer-events-none"
                                                    />
                                                    <span>{player}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}

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

                {/* Player Filter and Sort By for "All Scores" */}
                {reportType === 'all-scores' && (
                    <>
                        {/* Player Filter */}
                        <Popover open={playerSearchOpen} onOpenChange={setPlayerSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={playerSearchOpen}
                                    className="w-[200px] justify-between h-9 text-xs bg-muted/50 border-border"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden overflow-ellipsis">
                                        <Users className="w-3 h-3" />
                                        {selectedPlayerForScores
                                            ? overallRankings.find((p) => p.username === selectedPlayerForScores)?.username || selectedPlayerForScores
                                            : "Select player..."}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0 bg-popover border-border">
                                <Command>
                                    <CommandInput placeholder="Search player..." />
                                    <CommandList>
                                        <CommandEmpty>No player found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="all_players_reset_value"
                                                onSelect={() => {
                                                    setSelectedPlayerForScores('');
                                                    setPlayerSearchOpen(false);
                                                }}
                                                className="font-medium text-muted-foreground"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedPlayerForScores === '' ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                All Players
                                            </CommandItem>
                                            {overallRankings.map((player) => (
                                                <CommandItem
                                                    key={player.username}
                                                    value={player.username}
                                                    onSelect={(currentValue) => {
                                                        setSelectedPlayerForScores(currentValue === selectedPlayerForScores ? "" : currentValue);
                                                        setPlayerSearchOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedPlayerForScores === player.username ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {player.username}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Sort By Filter */}
                        <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                            <SelectTrigger className="w-[140px] h-9 text-xs bg-muted/50 border-border">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rank">🏅 Rank</SelectItem>
                                <SelectItem value="date">📅 Date</SelectItem>
                            </SelectContent>
                        </Select>
                    </>
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

            </div>

            {/* Content area */}
            {isLoading ? (
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
            )}
        </Card>
    );
};
