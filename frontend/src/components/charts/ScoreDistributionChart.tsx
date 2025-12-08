import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { RankedScore } from '@/services/api';
import { Card } from '@/components/ui/card';

interface ScoreDistributionChartProps {
    scores: RankedScore[];
    gameMode: string;
}

export const ScoreDistributionChart = ({ scores, gameMode }: ScoreDistributionChartProps) => {
    const data = useMemo(() => {
        if (!scores.length) return [];

        // Determine range
        const maxScore = Math.max(...scores.map(s => s.score));
        const bucketSize = maxScore > 1000 ? 100 : maxScore > 100 ? 10 : 5;
        
        // Create buckets
        const buckets: Record<string, number> = {};
        scores.forEach(s => {
            const bucketIndex = Math.floor(s.score / bucketSize);
            const bucketStart = bucketIndex * bucketSize;
            const bucketLabel = `${bucketStart}-${bucketStart + bucketSize - 1}`;
            buckets[bucketLabel] = (buckets[bucketLabel] || 0) + 1;
        });

        // Convert to array and sort
        return Object.entries(buckets)
            .map(([range, count]) => {
                const start = parseInt(range.split('-')[0]);
                return { range, count, start };
            })
            .sort((a, b) => a.start - b.start);

    }, [scores]);

    if (!scores.length) return null;

    return (
        <Card className="p-4 bg-muted/30 border-none mb-6">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                Score Distribution
                <span className="text-xs font-normal opacity-70">(Histogram)</span>
            </h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                            dataKey="range" 
                            tick={{ fontSize: 10, fill: '#888' }} 
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis 
                            tick={{ fontSize: 10, fill: '#888' }} 
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Bar dataKey="count" name="Players" radius={[4, 4, 0, 0]}>
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.7} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
