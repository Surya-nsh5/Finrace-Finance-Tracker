import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import { useNavigate } from "react-router-dom";
import { API_PATHS } from "../../utils/apiPaths";
import useSWR from "swr";
import { fetcher } from "../../utils/fetcher";
import InfoCard from "../../components/Cards/InfoCard";
import { addThousandsSeparator } from "../../utils/helper";
import RecentTransactions from "../../components/Dashboard/RecentTransactions";
import FinanceOverview from "../../components/Dashboard/FinanceOverview";
import RecentIncomeWithChart from "../../components/Dashboard/RecentIncomeWithChart";
import RecentIncome from "../../components/Dashboard/RecentIncome";
import ExpenseTransactions from "../../components/Dashboard/ExpenseTransactions";
import Last30DaysExpenses from "../../components/Dashboard/Last30DaysExpenses";

import { LuUsers, LuWalletMinimal } from "react-icons/lu";
import { IoMdCard } from "react-icons/io";

const Home = () => {
  useUserAuth();

  const navigate = useNavigate();

  const { data: dashboardData, isLoading: loading, error } = useSWR(API_PATHS.DASHBOARD.GET_DATA, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60000, // 1 minute deduping to avoid spam
  });

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="transition-page transition-colors duration-300">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
            Dashboard
          </h1>
          <p className="text-[var(--color-text)] opacity-60">
            Overview of your financial situation
          </p>
        </div>

        {/* Info Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <InfoCard
            icon={<IoMdCard />}
            label="Total Balance"
            value={addThousandsSeparator(dashboardData?.totalBalance || 0)}
            color="text-[#D4AF37] bg-[#D4AF37]/10"
            isHighlight={true}
            index={0}
            loading={loading}
          />

          <InfoCard
            icon={<LuWalletMinimal />}
            label="Total Income"
            value={addThousandsSeparator(dashboardData?.totalIncome || 0)}
            color="text-[#22C55E] bg-[#22C55E]/10"
            index={1}
            loading={loading}
          />

          <InfoCard
            icon={<LuUsers />}
            label="Total Expenses"
            value={addThousandsSeparator(dashboardData?.totalExpenses || 0)}
            color="text-[#EF4444] bg-[#EF4444]/10"
            index={2}
            loading={loading}
          />
        </div>

        {/* Two Column Layout: Recent Transactions and Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div
            className="animate-slide-in-left"
            style={{ animationDelay: "80ms" }}
          >
            <RecentTransactions
              transactions={dashboardData?.recentTransactions}
              onSeeMore={() => navigate("/transactions")}
              loading={loading}
            />
          </div>

          <div
            className="animate-slide-in-right"
            style={{ animationDelay: "80ms" }}
          >
            <FinanceOverview
              totalBalance={dashboardData?.totalBalance || 0}
              totalIncome={dashboardData?.totalIncome || 0}
              totalExpenses={dashboardData?.totalExpenses || 0}
              loading={loading}
            />
          </div>
        </div>

        {/* Two Column Layout: Last 60 Days Income and Income List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div
            className="animate-slide-in-left cursor-pointer transition-transform hover:scale-[1.01]"
            style={{ animationDelay: "160ms" }}
            onClick={() => navigate("/transactions", { state: { activeTab: "income" } })}
          >
            <RecentIncomeWithChart
              data={dashboardData?.last60DaysIncome?.transactions || []}
              totalIncome={dashboardData?.totalIncome || 0}
              loading={loading}
            />
          </div>

          <div
            className="animate-slide-in-right"
            style={{ animationDelay: "160ms" }}
          >
            <RecentIncome
              transactions={dashboardData?.last60DaysIncome?.transactions || []}
              onSeeMore={() => navigate("/transactions", { state: { activeTab: "income" } })}
              loading={loading}
            />
          </div>
        </div>

        {/* Two Column Layout: Expenses List and Last 30 Days Expenses Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div
            className="animate-slide-in-left"
            style={{ animationDelay: "240ms" }}
          >
            <ExpenseTransactions
              transactions={
                dashboardData?.last30DaysExpenses?.transactions || []
              }
              onSeeMore={() => navigate("/transactions", { state: { activeTab: "expense" } })}
              loading={loading}
            />
          </div>

          <div
            className="animate-slide-in-right cursor-pointer transition-transform hover:scale-[1.01]"
            style={{ animationDelay: "240ms" }}
            onClick={() => navigate("/transactions", { state: { activeTab: "expense" } })}
          >
            <Last30DaysExpenses
              data={dashboardData?.last30DaysExpenses?.transactions || []}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
