import React, { useMemo } from "react";
import CustomPieChart from "../Charts/CustomPieChart";
import { addThousandsSeparator } from "../../utils/helper";
import Skeleton from "../common/Skeleton";

// Colors: Purple for Balance, Green for Income, Red for Expenses
const COLORS = ["#7C3AED", "#22C55E", "#EF4444"];

const FinanceOverview = React.memo(
  ({ totalBalance, totalIncome, totalExpenses, loading = false }) => {
    // Memoize data preparation for faster rendering
    const { financeData, hasData, balance, legendData } = useMemo(() => {
      const bal = Number(totalBalance) || 0;
      const inc = Number(totalIncome) || 0;
      const exp = Number(totalExpenses) || 0;

      const data = [
        { name: "Balance", amount: Math.max(Math.abs(bal), 0) },
        { name: "Income", amount: Math.max(Math.abs(inc), 0) },
        { name: "Expenses", amount: Math.max(Math.abs(exp), 0) },
      ].filter((item) => item.amount > 0);

      // Create legend data with colors
      const legend = data.map((item, index) => ({
        name: item.name,
        color: COLORS[index % COLORS.length],
      }));

      return {
        financeData: data,
        hasData: data.length > 0,
        balance: bal,
        legendData: legend,
      };
    }, [totalBalance, totalIncome, totalExpenses]);

    return (
      <div className="card h-full flex flex-col">
        <div className="flex items-start justify-between mb-4 sm:mb-6 flex-shrink-0">
          <h5 className="text-base sm:text-lg font-bold text-[var(--color-text)] transition-colors duration-200 hover:text-primary">
            Financial Overview
          </h5>
        </div>

        <div className="w-full flex-1 flex items-center justify-center">
          {loading ? (
            <div className="w-full flex flex-col items-center gap-6 py-4">
              <Skeleton variant="circular" width="180px" height="180px" />
              <div className="flex gap-4 justify-center w-full">
                <Skeleton width="60px" height="12px" />
                <Skeleton width="60px" height="12px" />
                <Skeleton width="60px" height="12px" />
              </div>
            </div>
          ) : hasData ? (
            <CustomPieChart
              data={financeData}
              colors={COLORS}
              showTextAnchor={true}
              label="Total Balance"
              totalAmount={`₹${addThousandsSeparator(balance)}`}
              legendData={legendData}
            />
          ) : (
            <div className="text-center py-12 sm:py-16 text-[var(--color-text)] opacity-40 w-full">
              <p className="text-xs sm:text-sm">No financial data available</p>
            </div>
          )}
        </div>
      </div>
    );
  },
);

export default FinanceOverview;
