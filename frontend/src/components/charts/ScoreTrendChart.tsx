import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { RankedScore } from '@/services/api';
import { Card } from '@/components/ui/card';

interface ScoreTrendChartProps {
    scores: RankedScore[];
    gameMode: string;
}

export const ScoreTrendChart = ({ scores, gameMode }: ScoreTrendChartProps) => {
    const data = useMemo(() => {
        if (!scores.length) return [];
        
        // Sort chronologically
        return [...scores]
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map(s => ({
                ...s,
                date: new Date(s.timestamp).toLocaleDateString(),
                time: new Date(s.timestamp).toLocaleTimeString()
            }));
    }, [scores]);

    if (data.length < 2) return null;

    return (
        <Card className="p-4 bg-muted/30 border-none mb-6">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                Recent Activity
                <span className="text-xs font-normal opacity-70">(Score History)</span>
            </h3>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10, fill: '#888' }} 
                            axisLine={false}
                            tickLine={false}
                            minTickGap={30}
                        />
                        <YAxis 
                            tick={{ fontSize: 10, fill: '#888' }} 
                            axisLine={false}
                            tickLine={false}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '4px' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#888', fontSize: '12px', marginBottom: '4px' }}
                            labelFormatter={(label, payload) => {
                                if (payload && payload.length > 0) {
                                    return `${payload[0].payload.date} ${payload[0].payload.time}`;
                                }
                                return label;
                            }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="hsl(var(--accent))" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--accent))', r: 2, strokeWidth: 0 }}
                            activeDot={{ r: 4, stroke: '#fff', strokeWidth: 1 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};
