import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

// Format large numbers
const formatYAxisValue = (value) => {
    if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
};

const CustomDualLineChart = React.memo(({ data = [], lines = [], xAxisKey = 'date', height }) => {
    const { isDarkMode } = useTheme();

    // Detect desktop view for larger chart
    const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);

    React.useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Use passed height or responsive default
    const chartHeight = height || (isDesktop ? 380 : 300);

    const CustomTooltip = React.useCallback(({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[var(--color-card)] shadow-lg rounded-lg p-3 border border-[var(--color-border)]">
                    <p className="text-sm font-semibold text-[var(--color-text)] mb-2">
                        {payload[0].payload[xAxisKey]}
                    </p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: ₹{entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    }, [xAxisKey]);

    // Memoize chart data
    const chartData = useMemo(() => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return [];
        }
        return data;
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-[var(--color-text)] opacity-60">
                <p>No data available</p>
            </div>
        );
    }

    return (
        <div className="bg-transparent">
            <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart data={chartData} margin={isDesktop ? { top: 5, right: 10, left: 0, bottom: 5 } : { top: 5, right: 5, left: -15, bottom: 5 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={isDarkMode ? "rgba(212, 175, 55, 0.15)" : "#e5e7eb"}
                        opacity={0.5}
                    />
                    <XAxis
                        dataKey={xAxisKey}
                        tick={{ fontSize: isDesktop ? 11 : 9, fill: isDarkMode ? "#94A3B8" : "#555" }}
                        stroke={isDarkMode ? "rgba(212, 175, 55, 0.15)" : "#d1d5db"}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: isDesktop ? 12 : 9, fill: isDarkMode ? "#94A3B8" : "#555" }}
                        stroke={isDarkMode ? "rgba(212, 175, 55, 0.15)" : "#d1d5db"}
                        tickLine={false}
                        tickFormatter={formatYAxisValue}
                        width={isDesktop ? 45 : 35}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={false} />

                    {lines.map((line, index) => (
                        <Line
                            key={index}
                            type="monotone"
                            dataKey={line.dataKey}
                            stroke={line.stroke}
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: line.stroke, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: line.stroke }}
                            name={line.name}
                            animationDuration={300}
                            animationEasing="ease-in-out"
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
});

CustomDualLineChart.displayName = 'CustomDualLineChart';

export default CustomDualLineChart;
