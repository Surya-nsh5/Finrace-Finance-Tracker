import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import Modal from "../../components/layouts/Modal";
import UnifiedTransactionForm from "../../components/Transactions/UnifiedTransactionForm";
import { toast } from "react-hot-toast";
import TransactionList from "../../components/Transactions/TransactionList";
import useSWR from "swr";
import { useUserAuth } from "../../hooks/useUserAuth";
import { LuPlus } from "react-icons/lu";
import CustomDualLineChart from "../../components/Charts/CustomDualLineChart";
import moment from "moment";

import { useLocation } from "react-router-dom";

const Transactions = () => {
    useUserAuth();
    const location = useLocation();

    const [openAddModal, setOpenAddModal] = useState(false);
    const submitHandlerRef = useRef(null);

    // Filter states
    const [filterType, setFilterType] = useState(location.state?.activeTab || "all"); // all, income, expense
    const [dateRange, setDateRange] = useState("30"); // "30", "90", "365", "all"

    // Fetch all transactions (both income and expense) via SWR
    const fetchTransactionsData = async () => {
        const [incomeResponse, expenseResponse] = await Promise.all([
            axiosInstance.get(API_PATHS.INCOME.GET_ALL_INCOME),
            axiosInstance.get(API_PATHS.EXPENSE.GET_ALL_EXPENSE),
        ]);

        const incomeData = (Array.isArray(incomeResponse.data) ? incomeResponse.data : []).map(item => ({
            ...item,
            type: 'income',
            title: item.source || item.category,
        }));

        const expenseData = (Array.isArray(expenseResponse.data) ? expenseResponse.data : []).map(item => ({
            ...item,
            type: 'expense',
            title: item.category || item.source,
        }));

        // Combine and sort by date (most recent first)
        return [...incomeData, ...expenseData].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
    };

    const { data: transactions = [], isLoading: loading, mutate: refreshTransactions } = useSWR(
        'all_transactions',
        fetchTransactionsData,
        {
            revalidateOnFocus: true,
            dedupingInterval: 30000
        }
    );

    // Handle Add Transaction
    const handleAddTransaction = async (transaction) => {
        const { type, title, amount, date, icon, image } = transaction;

        // Validation
        if (!title.trim()) {
            toast.error(`${type === 'income' ? 'Income source' : 'Expense category'} is required`);
            return;
        }

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            toast.error("Amount should be greater than 0");
            return;
        }

        if (!date) {
            toast.error("Date is required");
            return;
        }

        try {
            const endpoint = type === 'income'
                ? API_PATHS.INCOME.ADD_INCOME
                : API_PATHS.EXPENSE.ADD_EXPENSE;

            const payload = type === 'income'
                ? { source: title, amount, date, icon }
                : { category: title, amount, date, icon, image };

            // Handle image upload for expenses
            if (type === 'expense' && image) {
                const formData = new FormData();
                formData.append('category', title);
                formData.append('amount', amount);
                formData.append('date', date);
                formData.append('icon', icon);
                formData.append('image', image);

                await axiosInstance.post(endpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await axiosInstance.post(endpoint, payload);
            }

            setOpenAddModal(false);
            toast.success(`${type === 'income' ? 'Income' : 'Expense'} added successfully`);
            refreshTransactions();
        } catch (error) {
            console.error("Error adding transaction:", error);
            toast.error(error.response?.data?.message || "Failed to add transaction");
        }
    };

    // Handle Delete Transaction
    const handleDeleteTransaction = async (id, type) => {
        try {
            const endpoint = type === 'income'
                ? API_PATHS.INCOME.DELETE_INCOME(id)
                : API_PATHS.EXPENSE.DELETE_EXPENSE(id);

            await axiosInstance.delete(endpoint);
            toast.success(`${type === 'income' ? 'Income' : 'Expense'} deleted successfully`);
            refreshTransactions();
        } catch (error) {
            console.error("Error deleting transaction:", error);
            toast.error("Failed to delete transaction");
        }
    };

    // Handle Download Income
    const handleDownloadIncome = async () => {
        try {
            const response = await axiosInstance.get(
                API_PATHS.INCOME.DOWNLOAD_INCOME,
                { responseType: "blob" }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "Income_details.xlsx");
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Income data downloaded successfully");
        } catch (error) {
            console.error("Error downloading income:", error);
            toast.error("Failed to download income data");
        }
    };

    // Handle Download Expense
    const handleDownloadExpense = async () => {
        try {
            const response = await axiosInstance.get(
                API_PATHS.EXPENSE.DOWNLOAD_EXPENSE,
                { responseType: "blob" }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "Expense_details.xlsx");
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Expense data downloaded successfully");
        } catch (error) {
            console.error("Error downloading expense:", error);
            toast.error("Failed to download expense data");
        }
    };

    // SWR handles initial fetch automatically
    // Removed useEffect for fetchAllTransactions

    // Date filtered transactions
    const dateFilteredTransactions = useMemo(() => {
        if (dateRange === "all") return transactions;

        const days = parseInt(dateRange);
        const cutoffDate = moment().subtract(days, 'days').startOf('day');

        return transactions.filter(t => moment(t.date).isSameOrAfter(cutoffDate));
    }, [transactions, dateRange]);

    // Filter transactions based on selected type AND date range
    const filteredTransactions = useMemo(() => {
        return filterType === "all"
            ? dateFilteredTransactions
            : dateFilteredTransactions.filter(t => t.type === filterType);
    }, [dateFilteredTransactions, filterType]);

    // Calculate totals based on date range
    const totalIncome = dateFilteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = dateFilteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    // Prepare chart data - group by date
    const chartData = useMemo(() => {
        const dataMap = {};

        if (dateRange === "30" || dateRange === "90") {
            const days = parseInt(dateRange);
            for (let i = days - 1; i >= 0; i--) {
                const date = moment().subtract(i, 'days').format('DD MMM');
                dataMap[date] = { date, income: 0, expense: 0 };
            }

            dateFilteredTransactions.forEach(transaction => {
                const date = moment(transaction.date).format('DD MMM');
                if (dataMap[date]) {
                    if (transaction.type === 'income') {
                        dataMap[date].income += Number(transaction.amount);
                    } else {
                        dataMap[date].expense += Number(transaction.amount);
                    }
                }
            });
        } else {
            // For 365 days or Lifetime, group by Month
            // 365 days: Last 12 months
            // Lifetime: All available months from data
            if (dateRange === "365") {
                for (let i = 11; i >= 0; i--) {
                    const date = moment().subtract(i, 'months').format('MMM YYYY');
                    dataMap[date] = { date, income: 0, expense: 0 };
                }
            }

            // Populate data
            dateFilteredTransactions.forEach(transaction => {
                const date = moment(transaction.date).format('MMM YYYY');
                // If lifetime, we might create keys dynamically
                if (dateRange === "all" && !dataMap[date]) {
                    dataMap[date] = { date, income: 0, expense: 0, sortKey: moment(transaction.date).format('YYYYMM') };
                }

                if (dataMap[date]) {
                    if (transaction.type === 'income') {
                        dataMap[date].income += Number(transaction.amount);
                    } else {
                        dataMap[date].expense += Number(transaction.amount);
                    }
                }
            });

            if (dateRange === "all") {
                return Object.values(dataMap).sort((a, b) => a.sortKey - b.sortKey);
            }
        }

        return Object.values(dataMap);
    }, [dateFilteredTransactions, dateRange]);

    return (
        <DashboardLayout activeMenu="Transactions">
            <div className="transition-page transition-colors duration-300">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
                        Transactions
                    </h1>
                    <p className="text-[var(--color-text)] opacity-60">
                        Manage all your income and expenses in one place
                    </p>
                </div>

                {/* Transaction Trends Chart */}
                {/* Transaction Trends Section */}
                <div className="card mb-6 overflow-hidden">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-8">
                        {/* Title & Subtitle */}
                        <div className="flex flex-col gap-1.5 max-w-xl">
                            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
                                Transaction Trends <span className="text-primary">({dateRange === 'all' ? 'Lifetime' : `Last ${dateRange} Days`})</span>
                            </h2>
                            <p className="text-sm sm:text-base text-[var(--color-text)] opacity-60 font-medium">
                                Track your income and expenses over time
                            </p>
                        </div>

                        {/* Controls & Stats Container */}
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 lg:gap-12 w-full xl:w-auto">
                            {/* Date Range Selector - Stacked on Mobile/Tablet, Horizontal on lg+ */}
                            <div className="flex items-center gap-2 bg-[var(--color-input)] p-1.5 rounded-2xl border border-[var(--color-border)] shadow-sm backdrop-blur-sm shrink-0">
                                {['30', '90', '365', 'all'].map(range => (
                                    <button
                                        key={range}
                                        onClick={() => setDateRange(range)}
                                        className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl transition-all duration-200 flex flex-col lg:flex-row items-center justify-center lg:gap-1.5 min-w-[65px] sm:min-w-[80px] lg:min-w-0 relative ${dateRange === range
                                            ? 'bg-primary text-white shadow-md z-10'
                                            : 'text-[var(--color-text)] opacity-50 hover:opacity-100 hover:bg-[var(--color-bg)] hover:shadow-sm'
                                            }`}
                                    >
                                        <span className="text-xs sm:text-sm font-bold leading-none capitalize whitespace-nowrap">
                                            {range === 'all' ? 'Lifetime' : range}
                                        </span>
                                        {range !== 'all' && (
                                            <span className={`text-[10px] sm:text-xs mt-1 lg:mt-0 font-extrabold lg:font-bold lg:normal-case lg:tracking-normal uppercase tracking-widest ${dateRange === range ? 'text-white/90' : 'opacity-70'}`}>
                                                Days
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Summary Stats - Vertically stacked as in image */}
                            <div className="grid grid-cols-2 md:grid-cols-1 gap-6 md:gap-4 py-1 pr-2 w-full md:w-auto">
                                <div className="flex items-center gap-3 transition-transform hover:translate-x-1">
                                    <div className="w-1 md:w-4 h-6 md:h-4 bg-income rounded-full border-2 border-white/10 shrink-0"></div>
                                    <p className="text-sm sm:text-base font-semibold text-[var(--color-text)] whitespace-nowrap">
                                        Income: <span className="font-bold text-[var(--color-text)] text-lg sm:text-xl ml-1">₹{totalIncome.toLocaleString(undefined, { minimumFractionDigits: totalIncome % 1 !== 0 ? 2 : 0, maximumFractionDigits: totalIncome % 1 !== 0 ? 2 : 0 })}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 transition-transform hover:translate-x-1">
                                    <div className="w-1 md:w-4 h-6 md:h-4 bg-expense rounded-full border-2 border-white/10 shrink-0"></div>
                                    <p className="text-sm sm:text-base font-semibold text-[var(--color-text)] whitespace-nowrap">
                                        Expense: <span className="font-bold text-[var(--color-text)] text-lg sm:text-xl ml-1">₹{totalExpense.toLocaleString(undefined, { minimumFractionDigits: totalExpense % 1 !== 0 ? 2 : 0, maximumFractionDigits: totalExpense % 1 !== 0 ? 2 : 0 })}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--color-bg)] rounded-2xl p-1.5 sm:p-6 border border-[var(--color-border)] shadow-inner">
                        <CustomDualLineChart
                            data={chartData}
                            lines={[
                                { dataKey: "income", stroke: "#22C55E", name: "Income", strokeWidth: 3 },
                                { dataKey: "expense", stroke: "#EF4444", name: "Expense", strokeWidth: 3 }
                            ]}
                            xAxisKey="date"
                            height={window.innerWidth >= 1024 ? 380 : 300}
                        />
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                    {/* Filter Tabs */}
                    <div className="flex gap-2 bg-[var(--color-input)] p-1 rounded-lg">
                        <button
                            onClick={() => setFilterType("all")}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${filterType === "all"
                                ? "bg-primary text-white"
                                : "text-[var(--color-text)] opacity-70 hover:opacity-100"
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterType("income")}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${filterType === "income"
                                ? "bg-income text-white"
                                : "text-[var(--color-text)] opacity-70 hover:opacity-100"
                                }`}
                        >
                            Income
                        </button>
                        <button
                            onClick={() => setFilterType("expense")}
                            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${filterType === "expense"
                                ? "bg-expense text-white"
                                : "text-[var(--color-text)] opacity-70 hover:opacity-100"
                                }`}
                        >
                            Expense
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Add Transaction Button */}
                        <button
                            onClick={() => setOpenAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition shadow-md hover:shadow-lg"
                        >
                            <LuPlus className="text-lg" />
                            <span>Add Transaction</span>
                        </button>
                    </div>
                </div>

                {/* Transaction List */}
                <TransactionList
                    transactions={filteredTransactions}
                    loading={loading}
                    onDelete={handleDeleteTransaction}
                    onRefresh={refreshTransactions}
                />

                {/* Add Transaction Modal */}
                <Modal
                    isOpen={openAddModal}
                    onClose={() => setOpenAddModal(false)}
                    title="Add Transaction"
                    footer={
                        <button
                            onClick={() => submitHandlerRef.current?.()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <LuPlus className="text-xl" />
                            <span>Add Transaction</span>
                        </button>
                    }
                >
                    <UnifiedTransactionForm
                        submitHandlerRef={submitHandlerRef}
                        onAddTransaction={handleAddTransaction}
                    />
                </Modal>
            </div>
        </DashboardLayout >
    );
};

export default Transactions;
