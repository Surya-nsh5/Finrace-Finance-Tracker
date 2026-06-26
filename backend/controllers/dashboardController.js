const Income = require("../models/Income");
const Expense = require("../models/Expense");
const { Types } = require("mongoose");

const { getOrSetCache } = require("../utils/cache");

/**
 * Controller to aggregate and fetch all data required for the Dashboard home view.
 * Uses parallel execution and database-side aggregations for maximum performance.
 */
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const userObjectId = new Types.ObjectId(String(userId));
    
    // Attempt to get cached dashboard data (1 minute TTL to stay mostly fresh)
    const dashboardData = await getOrSetCache(`dashboard_${userId}`, async () => {
      // Pre-calculate timeframe boundaries
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Initializing high-performance database queries

      // 1 & 2: Life-time totals for balance calculation
      const totalIncomePromise = Income.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      const totalExpensePromise = Expense.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      // 3: 60-day Income window (Totals + Recent transactions)
      const last60DaysIncomeTotalPromise = Income.aggregate([
        { $match: { userId: userObjectId, date: { $gte: sixtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      const last60DaysIncomeTransactionsPromise = Income.find({
        userId: userObjectId,
        date: { $gte: sixtyDaysAgo },
      }).sort({ date: -1 }).limit(50).lean();

      // 4: 30-day Expense window (Totals + Recent transactions)
      const last30DaysExpenseTotalPromise = Expense.aggregate([
        { $match: { userId: userObjectId, date: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);

      const last30DaysExpenseTransactionsPromise = Expense.find({
        userId: userObjectId,
        date: { $gte: thirtyDaysAgo },
      }).sort({ date: -1 }).limit(50).lean();

      // 5 & 6: Fixed recent feed (top 5 of each)
      const last5IncomePromise = Income.find({ userId: userObjectId })
        .sort({ date: -1 })
        .limit(5)
        .lean();

      const last5ExpensesPromise = Expense.find({ userId: userObjectId })
        .sort({ date: -1 })
        .limit(5)
        .lean();

      /**
       * Parallel Execution:
       * We trigger all promises simultaneously to avoid blocking the event loop.
       * This ensures the dashboard loads as fast as the slowest single query.
       */
      const [
        totalIncomeResult,
        totalExpenseResult,
        last60DaysIncomeTotalResult,
        last30DaysExpenseTotalResult,
        last60DaysIncomeTransactions,
        last30DaysExpenseTransactions,
        last5Income,
        last5Expenses
      ] = await Promise.all([
        totalIncomePromise,
        totalExpensePromise,
        last60DaysIncomeTotalPromise,
        last30DaysExpenseTotalPromise,
        last60DaysIncomeTransactionsPromise,
        last30DaysExpenseTransactionsPromise,
        last5IncomePromise,
        last5ExpensesPromise
      ]);

      const incomeLast60DaysTotal = last60DaysIncomeTotalResult[0]?.total || 0;
      const expenseLast30DaysTotal = last30DaysExpenseTotalResult[0]?.total || 0;

      // Interleave and sort recent transactions by date
      const lastTransactions = [
        ...last5Income.map((txn) => ({ ...txn, type: "income" })),
        ...last5Expenses.map((txn) => ({ ...txn, type: "expense" })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        totalBalance: (totalIncomeResult[0]?.total || 0) - (totalExpenseResult[0]?.total || 0),
        totalIncome: totalIncomeResult[0]?.total || 0,
        totalExpenses: totalExpenseResult[0]?.total || 0,
        last30DaysExpenses: {
          total: expenseLast30DaysTotal,
          transactions: last30DaysExpenseTransactions,
        },
        last60DaysIncome: {
          total: incomeLast60DaysTotal,
          transactions: last60DaysIncomeTransactions,
        },
        recentTransactions: lastTransactions,
      };
    }, 60); // 60 seconds cache

    // Set Vercel Edge Cache headers
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    
    // Construct unified dashboard response
    res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard Aggregation Error:", error);
    res.status(500).json({ message: "Unable to process dashboard statistics" });
  }
};
