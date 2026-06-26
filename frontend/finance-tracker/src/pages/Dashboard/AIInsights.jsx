import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { addThousandsSeparator } from "../../utils/helper";
import UpgradeSubscriptionModal from "../../components/layouts/UpgradeSubscriptionModal";
import {
  LuBrain,
  LuRefreshCw,
  LuTrendingUp,
  LuTrendingDown,
  LuX,
  LuTriangleAlert,
  LuCircleCheck,
  LuCircleArrowDown,
  LuLightbulb,
  LuCircleMinus,
  LuChevronRight,
} from "react-icons/lu";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";

const AIInsights = ({ onRefresh }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insufficientData, setInsufficientData] = useState(false);
  const [usageStats, setUsageStats] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");

  const fetchUsageStats = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.AI.USAGE_STATS);
      setUsageStats(response.data);
    } catch (err) {
      console.error("Failed to fetch usage stats:", err);
    }
  };

  const fetchCachedAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(API_PATHS.AI.CACHED_ANALYSIS);
      console.log("Cached analysis response:", response.data);

      if (response.data.hasCachedData) {
        setInsufficientData(false);
        setAnalysis(response.data.analysis);
        console.log("Loaded cached analysis:", response.data.analysis);
      } else {
        // No cached data, show message
        setAnalysis(null);
        console.log("No cached data available");
      }
    } catch (err) {
      console.error("Failed to fetch cached analysis:", err);
      console.error("Error response:", err.response?.data);
      // Don't set error state, just show empty state
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post(API_PATHS.AI.ANALYZE);
      console.log("AI Analysis response:", response.data);

      if (response.data.insufficientData) {
        setInsufficientData(true);
        setAnalysis(null);
      } else {
        setInsufficientData(false);
        setAnalysis(response.data.analysis);
        console.log("Set analysis data:", response.data.analysis);

        // Check if this was the last use
        if (response.data.usageInfo?.isLastUse) {
          toast.warning("⚠️ This was your last AI insight for today! Limit resets at midnight.", {
            duration: 5000,
            style: {
              background: '#FEF3C7',
              color: '#92400E',
              fontWeight: '600',
            }
          });
        } else {
          toast.success("AI insights generated successfully!");
        }
      }
      // Refresh usage stats after successful analysis
      await fetchUsageStats();
    } catch (err) {
      console.error("Failed to fetch AI analysis:", err);

      // Handle subscription limit reached (403) or upgrade required
      if (err.response?.status === 403 || err.response?.data?.upgradeRequired) {
        const msg = err.response?.data?.message || "Monthly AI insights limit reached for your current plan.";
        setUpgradeMessage(msg);
        setShowUpgradeModal(true);
        setError(msg);
      } else if (err.response?.status === 429) {
        const limitData = err.response.data;
        setError(`Daily limit reached: You can generate ${limitData.limit} AI insights per day. Used: ${limitData.used}/${limitData.limit}. Resets at midnight.`);
        toast.error("Daily AI insights limit reached");
      } else {
        const errorMessage = err.response?.data?.error || err.response?.data?.message || "Failed to generate AI insights. Please try again.";
        setError(errorMessage);
        toast.error("Failed to load AI insights");
      }
      // Refresh usage stats even on error
      await fetchUsageStats();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageStats();
    fetchCachedAnalysis(); // Load cached data first
  }, []);

  const handleRefresh = () => {
    fetchAIAnalysis();
    if (onRefresh) onRefresh();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6 animate-pulse">
          {/* Top Action Row Skeleton */}
          <div className="flex justify-end">
            <div className="w-40 h-10 bg-[var(--color-input)] rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Health Score Skeleton */}
            <div className="bg-[var(--color-card)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm flex flex-col justify-between h-48">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="w-32 h-4 bg-[var(--color-input)] rounded mb-3"></div>
                  <div className="w-48 h-10 bg-[var(--color-input)] rounded"></div>
                </div>
                <div className="w-20 h-6 bg-[var(--color-input)] rounded-full"></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-auto">
                <div className="h-16 bg-[var(--color-input)] rounded-xl"></div>
                <div className="h-16 bg-[var(--color-input)] rounded-xl"></div>
                <div className="h-16 bg-[var(--color-input)] rounded-xl"></div>
              </div>
            </div>

            {/* Next Month Prediction Skeleton */}
            <div className="bg-[var(--color-card)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm flex flex-col justify-between h-48">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="w-36 h-4 bg-[var(--color-input)] rounded mb-3"></div>
                  <div className="w-48 h-10 bg-[var(--color-input)] rounded"></div>
                </div>
                <div className="w-24 h-8 bg-[var(--color-input)] rounded-full"></div>
              </div>
              <div className="h-12 bg-[var(--color-input)] rounded-xl mt-auto"></div>
            </div>
          </div>

          {/* Artificial "Thinking" UI */}
          <div className="bg-[var(--color-card)] rounded-2xl p-8 border border-[var(--color-border)] shadow-sm text-center">
            <div className="relative w-16 h-16 mx-auto mb-6 mt-4">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-full z-10">
                <LuBrain className="text-primary text-3xl animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-3 animate-pulse">
              FinRace is analyzing your finances...
            </h3>
            <div className="w-full max-w-md mx-auto space-y-2 mb-4">
              <div className="h-2 bg-[var(--color-input)] rounded w-full"></div>
              <div className="h-2 bg-[var(--color-input)] rounded w-5/6 mx-auto"></div>
              <div className="h-2 bg-[var(--color-input)] rounded w-4/6 mx-auto"></div>
            </div>
          </div>
        </div>
      );
    }

    if (insufficientData) {
      return (
        <div className="bg-[var(--color-card)] rounded-2xl shadow-sm p-6 border border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary rounded-xl">
              <LuBrain className="text-white text-2xl" />
            </div>
            <h5 className="text-lg font-bold text-[var(--color-text)]">
              AI Financial Insights
            </h5>
          </div>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <LuBrain className="text-primary text-3xl" />
            </div>
            <h6 className="text-lg font-semibold text-[var(--color-text)] mb-2">
              Not Enough Data Yet
            </h6>
            <p className="text-sm text-[var(--color-text)] opacity-60 mb-6 max-w-md mx-auto">
              Keep tracking your expenses and income! AI insights will be
              available once you have at least 10 expense transactions and 3
              income entries from the last 3 months.
            </p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 mx-auto font-medium"
            >
              <LuRefreshCw className="text-lg" />
              Check Again
            </button>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-[var(--color-card)] rounded-2xl shadow-sm p-6 border border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary rounded-xl">
              <LuBrain className="text-white text-2xl" />
            </div>
            <h5 className="text-lg font-bold text-[var(--color-text)]">
              AI Financial Insights
            </h5>
          </div>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <LuX className="text-red-600 dark:text-red-400 text-3xl" />
            </div>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 mx-auto font-medium"
            >
              <LuRefreshCw className="text-lg" />
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (!analysis) {
      return (
        <div className="bg-[var(--color-card)] rounded-2xl shadow-sm p-6 border border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl">
                <LuBrain className="text-white text-2xl" />
              </div>
              <h5 className="text-lg font-bold text-[var(--color-text)]">
                AI Financial Insights
              </h5>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LuBrain className="text-primary text-4xl" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">
              No AI Insights Yet
            </h3>
            <p className="text-[var(--color-text)] opacity-60 mb-6 max-w-md mx-auto">
              Generate AI-powered insights to analyze your financial data, get personalized recommendations, and track your spending patterns.
            </p>
            <button
              onClick={fetchAIAnalysis}
              disabled={loading}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/95 transition flex items-center gap-2 mx-auto font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <LuBrain className="text-xl" />
              Generate New Insights
            </button>
            {usageStats && (
              <p className="text-xs text-[var(--color-text)] opacity-50 mt-4">
                {usageStats.insights.remaining} of {usageStats.insights.limit} insights remaining today
              </p>
            )}
          </div>
        </div>
      );
    }

    const {
      nextMonthExpensePrediction,
      spendingAnalysis,
      recommendations,
      financialHealthScore,
      insights,
      warningFlags,
    } = analysis;

    return (
      <div className="space-y-6">
        {/* Top Action Row */}
        <div className="flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-5 py-2.5 bg-primary/10 text-primary border border-primary/20 rounded-full hover:bg-primary/20 transition flex items-center justify-center gap-2 font-medium shadow-sm disabled:opacity-50 cursor-pointer"
            title={usageStats ? `${usageStats.insights.remaining} insights remaining` : 'Generate new insights'}
          >
            <LuRefreshCw className={`text-sm ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh Insights</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Financial Health Score */}
          {financialHealthScore && (
            <div className="bg-[var(--color-card)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-[var(--color-text)] opacity-60 font-medium mb-1">
                    Financial Health Score
                  </p>
                  <p className="text-4xl font-bold text-[var(--color-text)]">
                    {financialHealthScore.score}<span className="text-xl opacity-40">/100</span>
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${financialHealthScore.rating === "excellent" ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                    financialHealthScore.rating === "good" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                      financialHealthScore.rating === "fair" ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                        "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}
                >
                  {financialHealthScore.rating.toUpperCase()}
                </span>
              </div>

              {financialHealthScore.breakdown && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[var(--color-input)] rounded-xl p-3 text-center border border-[var(--color-border)]/50">
                    <p className="text-xs text-[var(--color-text)] opacity-60 mb-1">Savings</p>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{financialHealthScore.breakdown.savingsRate}</p>
                  </div>
                  <div className="bg-[var(--color-input)] rounded-xl p-3 text-center border border-[var(--color-border)]/50">
                    <p className="text-xs text-[var(--color-text)] opacity-60 mb-1">Control</p>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{financialHealthScore.breakdown.expenseControl}</p>
                  </div>
                  <div className="bg-[var(--color-input)] rounded-xl p-3 text-center border border-[var(--color-border)]/50">
                    <p className="text-xs text-[var(--color-text)] opacity-60 mb-1">Income</p>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{financialHealthScore.breakdown.incomeStability}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Next Month Prediction */}
          {nextMonthExpensePrediction && (
            <div className="bg-[var(--color-card)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-[var(--color-text)] opacity-60 font-medium mb-1">
                    Predicted Expenses
                  </p>
                  <p className="text-4xl font-bold text-[var(--color-text)]">
                    ₹{addThousandsSeparator(Math.round(nextMonthExpensePrediction.total))}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-[var(--color-input)] px-3 py-1.5 rounded-full border border-[var(--color-border)]/50">
                  {nextMonthExpensePrediction.trend === "increasing" ? (
                    <LuTrendingUp className="text-red-500 text-sm" />
                  ) : nextMonthExpensePrediction.trend === "decreasing" ? (
                    <LuTrendingDown className="text-green-500 text-sm" />
                  ) : <LuCircleMinus className="text-gray-500 text-sm" />}
                  <span className="text-xs font-semibold capitalize text-[var(--color-text)]">
                    {nextMonthExpensePrediction.trend}
                  </span>
                </div>
              </div>
              <div className="bg-[var(--color-input)] rounded-xl p-4 border border-[var(--color-border)]/50 flex items-center justify-between">
                <span className="text-sm text-[var(--color-text)] opacity-70">AI Confidence Score</span>
                <span className="text-sm font-bold text-[var(--color-text)]">{nextMonthExpensePrediction.confidence}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Warning Flags */}
        {warningFlags && warningFlags.length > 0 && (
          <div className="space-y-3 mt-8">
            <h6 className="text-sm font-semibold text-[var(--color-text)] opacity-70 uppercase tracking-wider mb-4">
              Attention Required
            </h6>
            {warningFlags.map((warning, idx) => (
              <div
                key={idx}
                className="flex gap-4 items-center bg-red-500/5 border border-red-500/20 rounded-xl p-4"
              >
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <LuTriangleAlert className="text-red-500 text-sm" />
                </div>
                <p className="text-sm text-[var(--color-text)] font-medium leading-relaxed">
                  {warning}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Overspending Categories */}
        {spendingAnalysis?.overSpendingCategories &&
          spendingAnalysis.overSpendingCategories.length > 0 && (
            <div className="space-y-3 mt-8">
              <h6 className="text-sm font-semibold text-[var(--color-text)] opacity-70 uppercase tracking-wider mb-4">
                Categories to Control
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {spendingAnalysis.overSpendingCategories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-base font-bold text-[var(--color-text)]">
                        {cat.category}
                      </p>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-md font-bold ${cat.severity === "high" ? "bg-red-500/10 text-red-500" :
                          cat.severity === "medium" ? "bg-yellow-500/10 text-yellow-500" :
                            "bg-orange-500/10 text-orange-500"
                          }`}
                      >
                        {cat.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-[var(--color-input)] p-3 rounded-xl border border-[var(--color-border)]/50">
                      <div>
                        <p className="text-xs text-[var(--color-text)] opacity-60 font-medium mb-1">Spent</p>
                        <p className="text-sm font-bold text-[var(--color-text)]">₹{addThousandsSeparator(Math.round(cat.currentSpending))}</p>
                      </div>
                      <div className="w-px h-6 bg-[var(--color-border)]/50"></div>
                      <div className="text-right">
                        <p className="text-xs text-[var(--color-text)] opacity-60 font-medium mb-1">Budget</p>
                        <p className="text-sm font-bold text-green-500">₹{addThousandsSeparator(Math.round(cat.recommendedBudget))}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text)] font-medium">
                      <LuLightbulb className="text-green-500" />
                      <span>Potential Savings: <span className="text-green-500 font-bold">₹{addThousandsSeparator(Math.round(cat.savingsPotential))}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Efficient Categories */}
        {spendingAnalysis?.efficientCategories &&
          spendingAnalysis.efficientCategories.length > 0 && (
            <div className="space-y-3 mt-8">
              <h6 className="text-sm font-semibold text-[var(--color-text)] opacity-70 uppercase tracking-wider mb-4">
                Well-Managed Categories
              </h6>
              <div className="flex flex-wrap gap-2">
                {spendingAnalysis.efficientCategories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-lg text-sm font-semibold border border-green-500/20"
                  >
                    <LuCircleCheck className="text-sm" />
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="space-y-3 mt-8">
            <h6 className="text-sm font-semibold text-[var(--color-text)] opacity-70 uppercase tracking-wider mb-4">
              AI Recommendations
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.slice(0, 5).map((rec, idx) => (
                <div
                  key={idx}
                  className="flex flex-col p-5 rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${rec.type === "reduce" ? "bg-red-500/10 text-red-500" :
                        rec.type === "maintain" ? "bg-green-500/10 text-green-500" :
                          "bg-blue-500/10 text-blue-500"
                        }`}>
                        {rec.type === "reduce" && <LuCircleArrowDown className="text-lg" />}
                        {rec.type === "maintain" && <LuCircleCheck className="text-lg" />}
                        {rec.type === "optimize" && <LuLightbulb className="text-lg" />}
                      </div>
                      {rec.category && (
                        <span className="text-sm font-bold text-[var(--color-text)]">
                          {rec.category}
                        </span>
                      )}
                    </div>
                    {rec.priority === "high" && (
                      <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded font-bold uppercase tracking-wider">
                        High Priority
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text)] opacity-80 leading-relaxed mb-auto">
                    {rec.message}
                  </p>
                  {rec.potentialSavings > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)]/50">
                      <p className="text-sm font-semibold">
                        <span className="text-[var(--color-text)] opacity-60">Potential Savings: </span>
                        <span className="text-green-500">₹{addThousandsSeparator(Math.round(rec.potentialSavings))}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General Insights */}
        {insights && insights.length > 0 && (
          <div className="space-y-3 mt-8">
            <h6 className="text-sm font-semibold text-[var(--color-text)] opacity-70 uppercase tracking-wider mb-4">
              Key Insights
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 items-start bg-[var(--color-card)] rounded-xl p-4 border border-[var(--color-border)] shadow-sm"
                >
                  <LuChevronRight className="text-primary text-lg mt-0.5 shrink-0" />
                  <p className="text-sm text-[var(--color-text)] font-medium leading-relaxed opacity-90">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout activeMenu="AI Insights">
      <div className="transition-page transition-colors duration-300">
        {/* Header */}
        {/* Clean Header & Inline Usage Stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2 tracking-tight">
              AI Insights
            </h1>
            <p className="text-[var(--color-text)] opacity-60 text-sm">
              Personalized financial analysis powered by Gemini AI
            </p>
          </div>

          {usageStats && (
            <div className="flex gap-5 items-center px-4 py-2.5 bg-[var(--color-input)] rounded-full border border-[var(--color-border)]/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                <span className="text-xs font-medium text-[var(--color-text)] opacity-80">
                  Insights: <span className="text-primary font-bold ml-1">{usageStats.insights.remaining}</span> left
                </span>
              </div>
              <div className="w-px h-3 bg-[var(--color-border)]"></div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs font-medium text-[var(--color-text)] opacity-80">
                  Scans: <span className="text-blue-500 font-bold ml-1">{usageStats.billScans.remaining}</span> left
                </span>
              </div>
            </div>
          )}
        </div>

        {renderContent()}
      </div>
      <UpgradeSubscriptionModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        limitType="insights"
        message={upgradeMessage}
      />
    </DashboardLayout>
  );
};

export default AIInsights;
