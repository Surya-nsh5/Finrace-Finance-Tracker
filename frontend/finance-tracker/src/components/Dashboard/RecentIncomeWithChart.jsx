import React, { useMemo } from "react";
import CustomBarChart from "../Charts/CustomBarChart";
import { addThousandsSeparator } from "../../utils/helper";
import Skeleton from "../common/Skeleton";

const COLORS = [
  "#22C55E",
  "#4ADE80",
  "#86EFAC",
  "#BBF7D0",
];

const RecentIncomeWithChart = React.memo(({ data, totalIncome, loading = false }) => {
  // Memoize chart data preparation for faster rendering
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Let's use a Map for grouping
    const dataMap = {};

    data.forEach(item => {
      if (!item?.date || !item?.amount) return;
      // Normalize date to day level
      const dateStr = item.date.split('T')[0]; // simple ISO split or use moment

      if (!dataMap[dateStr]) {
        dataMap[dateStr] = 0;
      }
      dataMap[dateStr] += Number(item.amount);
    });

    return Object.keys(dataMap)
      .sort((a, b) => new Date(a) - new Date(b))
      .map(date => ({
        name: date, // CustomBarChart will parse this
        amount: dataMap[date],
        // source: "Income" // Optional label for tooltip
      }));

  }, [data]);

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-start justify-between mb-4 sm:mb-6 flex-shrink-0">
        <h5 className="text-base sm:text-lg font-bold text-[var(--color-text)] transition-colors duration-200 hover:text-primary">
          Last 60 Days Income
        </h5>
        {loading ? (
          <div className="text-right flex-shrink-0 space-y-2">
            <Skeleton width="60px" height="12px" />
            <Skeleton width="80px" height="24px" />
          </div>
        ) : chartData.length > 0 && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-[var(--color-text)] opacity-70 mb-1">Total Income</p>
            <p className="text-lg sm:text-xl font-bold text-[var(--color-text)]">
              ₹{addThousandsSeparator(totalIncome)}
            </p>
          </div>
        )}
      </div>

      <div className="w-full -mx-2 flex-1 flex items-center">
        {loading ? (
          <div className="w-full h-48 flex items-end gap-2 px-4 pb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} width="100%" height={`${Math.random() * 60 + 20}%`} />
            ))}
          </div>
        ) : chartData.length > 0 ? (
          <CustomBarChart
            data={chartData}
            colors={COLORS}
            isDateBased={false}
          />
        ) : (
          <div className="text-center py-12 sm:py-16 text-[var(--color-text)] opacity-40 w-full">
            <p className="text-xs sm:text-sm">No income data available</p>
            <p className="text-xs mt-1">Add income to see the chart</p>
          </div>
        )}
      </div>
    </div>
  );
});

RecentIncomeWithChart.displayName = "RecentIncomeWithChart";

export default RecentIncomeWithChart;
