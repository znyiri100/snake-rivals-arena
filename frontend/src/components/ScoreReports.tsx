import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, type User, type Group, type RankedScore, type UserGameModeRank, type OverallRanking } from '@/services/api';
import { Trophy, Medal, Users, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ScoreReportsProps {
    user?: User | null;
}

type ReportType = 'overall' | 'all-scores' | 'best-per-user' | 'top-n';
type GameModeFilter = 'all' | 'snake' | 'minesweeper' | 'space_invaders' | 'tetris';

const GAME_MODE_LABELS: Record<string, string> = {
    snake: '🐍 Snake',
    minesweeper: '💣 Minesweeper',
    space_invaders: '🚀 Space Invaders',
    tetris: '🟦 Tetris'
};

export const ScoreReports = ({ user }: ScoreReportsProps) => {
    const [reportType, setReportType] = useState<ReportType>('overall');
    const [gameMode, setGameMode] = useState<GameModeFilter>('all');
    const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
    const [userGroups, setUserGroups] = useState<Group[]>([]);
    const [topNLimit, setTopNLimit] = useState<number>(10);
    const [isLoading, setIsLoading] = useState(true);

    // Data states
    const [allScores, setAllScores] = useState<RankedScore[]>([]);
    const [bestPerUser, setBestPerUser] = useState<UserGameModeRank[]>([]);
    const [topNData, setTopNData] = useState<Record<string, UserGameModeRank[]>>({});
    const [overallRankings, setOverallRankings] = useState<OverallRanking[]>([]);

    // Set user groups
    useEffect(() => {
        const currentUser = user || api.getCurrentUser();
        if (currentUser?.groups && currentUser.groups.length > 0) {
            setUserGroups(currentUser.groups);
            const isCurrentSelectionValid = currentUser.groups.some(g => g.id === selectedGroupId);
            if (selectedGroupId === 'all' || !isCurrentSelectionValid) {
                setSelectedGroupId(currentUser.groups[0].id);
            }
        } else {
            setUserGroups([]);
            setSelectedGroupId('all');
        }
    }, [user]);

    // Load data based on report type
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const groupId = selectedGroupId === 'all' ? undefined : selectedGroupId;
                const mode = gameMode === 'all' ? undefined : gameMode;

                switch (reportType) {
                    case 'all-scores':
                        const scores = await api.getAllScoresRanked(mode, groupId);
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
                setIsLoading(false);
            }
        };

        loadData();
    }, [reportType, gameMode, selectedGroupId, topNLimit]);

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
        // Group by game mode
        const byMode: Record<string, UserGameModeRank[]> = {};
        bestPerUser.forEach(entry => {
            if (!byMode[entry.game_mode]) byMode[entry.game_mode] = [];
            byMode[entry.game_mode].push(entry);
        });

        return (
            <div className="space-y-6">
                {Object.entries(byMode).map(([mode, entries]) => (
                    <div key={mode}>
                        <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                            {GAME_MODE_LABELS[mode] || mode}
                        </h3>
                        <div className="space-y-2">
                            {entries.map((entry) => (
                                <div
                                    key={`${entry.username}-${entry.game_mode}`}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded border border-border"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 text-center font-bold">
                                            {getRankIcon(entry.rank) || `#${entry.rank}`}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-foreground">{entry.username}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {entry.games_played} games played
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-primary neon-text">
                                        {entry.best_score}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
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

    const renderOverall = () => (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
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
                            {userGroups.map(group => (
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
            </div>

            {/* Report type selector */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Button
                    variant={reportType === 'overall' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportType('overall')}
                    className="neon-border"
                >
                    Overall Rankings
                </Button>
                <Button
                    variant={reportType === 'all-scores' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportType('all-scores')}
                >
                    All Scores
                </Button>
                <Button
                    variant={reportType === 'best-per-user' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportType('best-per-user')}
                >
                    Best Per User
                </Button>
                <Button
                    variant={reportType === 'top-n' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportType('top-n')}
                >
                    Top Players
                </Button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                    ))}
                </div>
            ) : (
                <>
                    {reportType === 'all-scores' && renderAllScores()}
                    {reportType === 'best-per-user' && renderBestPerUser()}
                    {reportType === 'top-n' && renderTopN()}
                    {reportType === 'overall' && renderOverall()}
                </>
            )}
        </Card>
    );
};
