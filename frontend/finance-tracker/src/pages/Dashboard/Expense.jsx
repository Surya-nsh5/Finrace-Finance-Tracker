import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import moment from "moment";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import ExpenseOverview from "../../components/Expense/ExpenseOverview";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import DropdownModal from "../../components/layouts/DropdownModal";
import AddExpenseForm from "../../components/Expense/AddExpenseForm";
import { toast } from "react-hot-toast";
import ExpenseList from "../../components/Expense/ExpenseList";
import { useUserAuth } from "../../hooks/useUserAuth";
import CSVBulkUpload from "../../components/Inputs/CSVBulkUpload";
import { LuPlus, LuTrendingDown } from "react-icons/lu";

const Expense = () => {
  useUserAuth();

  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);
  const [openAddExpenseModal, setOpenAddExpenseModal] = useState(false);
  const addButtonRef = useRef(null);
  const submitHandlerRef = useRef(null);

  const [dateRange, setDateRange] = useState("30");

  // Get All Expense Details
  const fetchExpenseDetails = useCallback(async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading(true);

    try {
      const response = await axiosInstance.get(
        API_PATHS.EXPENSE.GET_ALL_EXPENSE,
      );

      if (response.data) {
        setExpenseData(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.log("Something went wrong. Please try again.", error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // Handle Add Expense
  const handleAddExpense = async (expense) => {
    const { category, amount, date, icon } = expense;

    // Validation Checks
    if (!category.trim()) {
      toast.error("Expense category is required");
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
      await axiosInstance.post(API_PATHS.EXPENSE.ADD_EXPENSE, {
        category,
        amount,
        date,
        icon,
      });

      setOpenAddExpenseModal(false);
      toast.success("Expense added successfully");
      fetchExpenseDetails();
    } catch (error) {
      console.error(
        "Error adding Expense:",
        error.response?.data?.message || error.message,
      );
    }
  };

  // Delete Expense
  const deleteExpense = async (id) => {
    try {
      await axiosInstance.delete(API_PATHS.EXPENSE.DELETE_EXPENSE(id));
      toast.success("Expense details deleted successfully");
      fetchExpenseDetails();
    } catch (error) {
      console.error(
        "Error deleting Expense:",
        error.response?.data?.message || error.message,
      );
      toast.error("Failed to delete expense");
    }
  };

  // handle download Expense details
  const handleDownloadExpenseDetails = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.EXPENSE.DOWNLOAD_EXPENSE,
        {
          responseType: "blob",
        },
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "expense_details.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading expense details:", error);
      toast.error(
        "Failed to download expense details. Please try again later.",
      );
    }
  };

  useEffect(() => {
    fetchExpenseDetails();

    return () => { };
  }, [fetchExpenseDetails]);

  const addExpenseFooter = (
    <button
      type="button"
      className="w-full group flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-expense to-expense/90 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg shadow-expense/25 hover:shadow-xl hover:shadow-expense/30 transition-all duration-120 hover:scale-105 active:scale-95"
      onClick={() => submitHandlerRef.current && submitHandlerRef.current()}
    >
      <LuPlus className="text-base sm:text-lg group-hover:rotate-90 transition-transform duration-120" />
      <span>Add Expense</span>
      <LuTrendingDown className="text-sm sm:text-base opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-120" />
    </button>
  );

  // Filter Expense Data
  const filteredExpense = useMemo(() => {
    if (dateRange === "all") return expenseData;

    const days = parseInt(dateRange);
    const cutoffDate = moment().subtract(days, 'days').startOf('day');

    return expenseData.filter(item => moment(item.date).isSameOrAfter(cutoffDate));
  }, [expenseData, dateRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const dataMap = {};

    if (dateRange === "30" || dateRange === "90") {
      const days = parseInt(dateRange);
      for (let i = days - 1; i >= 0; i--) {
        const date = moment().subtract(i, 'days').format('DD'); // Expense chart uses DD format for XAxis usually? customLineChart uses dataKey="month" which is likely actually "date" or "day"
        // Let's check CustomLineChart usage. helper.js prepareExpenseLineChartData uses 'month' key but with 'DD' value.
        // CustomLineChart XAxis dataKey={xAxisKey || 'month'}
        // So I should use 'month' key for consistency with CustomLineChart default
        const dayLabel = moment().subtract(i, 'days').format('DD');
        // But wait, if we have multiple months (90 days), 'DD' is ambiguous (01, 02... could be any month)
        // Let's use DD MMM for better context if > 30 days, or just DD if 30 days.
        // CustomLineChart logic:
        // <XAxis dataKey={xAxisKey} ... />
        // If I change format here, I should ensure CustomLineChart displays it well.
        // Let's stick to what I did for Income: DD MMM.
        // BUT CustomLineChart might be expecting 'month' key.
        // Let's check ExpenseOverview usage. It uses prepareExpenseLineChartData which returns { month: 'DD', amount, category }.
        // CustomLineChart likely uses 'month' as default xAxisKey.
        // I will use 'month' as key but put DD MMM in it for better context.
        const label = moment().subtract(i, 'days').format('DD MMM');
        dataMap[label] = { month: label, amount: 0 };
      }

      filteredExpense.forEach(item => {
        const label = moment(item.date).format('DD MMM');
        if (dataMap[label]) {
          dataMap[label].amount += Number(item.amount);
        }
      });
    } else {
      // 365 or All
      if (dateRange === "365") {
        for (let i = 11; i >= 0; i--) {
          const date = moment().subtract(i, 'months').format('MMM YYYY');
          dataMap[date] = { month: date, amount: 0 };
        }
      }

      filteredExpense.forEach(item => {
        const date = moment(item.date).format('MMM YYYY');
        // Dynamic keys for lifetime
        if (dateRange === "all" && !dataMap[date]) {
          dataMap[date] = { month: date, amount: 0, sortKey: moment(item.date).format('YYYYMM') };
        }

        if (dataMap[date]) {
          dataMap[date].amount += Number(item.amount);
        }
      });

      if (dateRange === "all") {
        return Object.values(dataMap).sort((a, b) => a.sortKey - b.sortKey);
      }
    }

    return Object.values(dataMap);
  }, [filteredExpense, dateRange]);

  return (
    <DashboardLayout activeMenu="Expense">
      <div className="my-4 sm:my-6 mx-auto transition-page">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text)] mb-1 sm:mb-2">
                Expenses
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-[var(--color-text)] opacity-60">
                Monitor and control your spending
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <CSVBulkUpload
                type="expense"
                apiPath={API_PATHS.EXPENSE.BULK_UPLOAD_EXPENSE}
                onUploadComplete={fetchExpenseDetails}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <div className="animate-scale-in" style={{ animationDelay: "80ms" }}>
            <ExpenseOverview
              chartData={chartData}
              transactions={filteredExpense}
              onAddExpense={() => setOpenAddExpenseModal(true)}
              addButtonRef={addButtonRef}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "160ms" }}>
            <ExpenseList
              transactions={filteredExpense}
              onDelete={deleteExpense}
              onDownload={handleDownloadExpenseDetails}
            />
          </div>
        </div>

        <DropdownModal
          isOpen={openAddExpenseModal}
          onClose={() => setOpenAddExpenseModal(false)}
          title="Add Expense"
          triggerRef={addButtonRef}
          footer={addExpenseFooter}
        >
          <AddExpenseForm
            openAddExpense={handleAddExpense}
            submitHandlerRef={submitHandlerRef}
          />
        </DropdownModal>
      </div>
    </DashboardLayout>
  );
};

export default Expense;
