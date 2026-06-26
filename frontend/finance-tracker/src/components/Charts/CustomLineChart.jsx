import React, { useMemo } from 'react'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { useTheme } from "../../context/ThemeContext";

const CustomLineChart = React.memo(({ data = [] }) => {
    const { isDarkMode } = useTheme();

    const CustomToolTip = React.useCallback(({ active, payload }) => {
        if (active && payload && payload.length) {
            const label = payload[0].payload.category || payload[0].payload.source || 'N/A';
            return (
                <div className="bg-[var(--color-card)] shadow-md rounded-lg p-2 border border-[var(--color-border)]">
                    <p className="text-xs font-semibold text-primary mb-1">{label}</p>
                    <p className="text-sm text-[var(--color-text)] opacity-70">
                        Amount: <span className="text-sm font-medium text-[var(--color-text)]">₹{payload[0].payload.amount}</span>
                    </p>
                </div>
            );
        }
        return null;
    }, []);

    // Memoize chart data to prevent unnecessary re-renders
    const chartData = useMemo(() => {
        if (!data || !Array.isArray(data) || data.length === 0) {
            return [];
        }
        return data;
    }, [data]);

    return (
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(212, 175, 55, 0.15)" : "#f3f4f6"} opacity={0.5} vertical={false} />
                    <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: isDarkMode ? "#94A3B8" : "#555" }}
                        stroke='none'
                        tickCount={8}
                        minTickGap={30}
                        angle={0}
                        tickFormatter={(val, index) => {
                            // Reset the tracker on the first tick of a render pass
                            if (index === 0) window.__lastAreaChartMonth = '';
                            
                            if (typeof val === 'string') {
                                const parts = val.split(' ');
                                if (parts.length === 2 && !isNaN(parts[0])) {
                                    const month = parts[1];
                                    if (month !== window.__lastAreaChartMonth) {
                                        window.__lastAreaChartMonth = month;
                                        return month;
                                    }
                                    return ''; // Hide repeated month
                                }
                            }
                            return val;
                        }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: isDarkMode ? "#94A3B8" : "#555" }} stroke='none' />
                    <Tooltip content={<CustomToolTip />} cursor={false} />

                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#7C3AED"
                        fill="url(#incomeGradient)"
                        strokeWidth={3}
                        dot={{ r: 3, fill: "#A78BFA" }}
                        animationDuration={200}
                        animationEasing="ease-out"
                    />
                </AreaChart >
            </ResponsiveContainer >
        </div >
    );
});

CustomLineChart.displayName = 'CustomLineChart';

export default CustomLineChart;