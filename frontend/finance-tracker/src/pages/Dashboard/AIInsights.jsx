import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosinstance";
import { API_PATHS } from "../../utils/apiPaths";
import { addThousandsSeparator } from "../../utils/helper";
import {
  LuBrain,
  LuRefreshCw,
  LuTrendingUp,
  LuTrendingDown,
  LuX,
} from "react-icons/lu";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";

const AIInsights = ({ onRefresh }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insufficientData, setInsufficientData] = useState(false);
  const [usageStats, setUsageStats] = useState(null);

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

      // Handle rate limit error (429)
      if (err.response?.status === 429) {
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
        <div className="bg-[var(--color-card)] rounded-2xl shadow-sm p-6 border border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary rounded-xl">
              <LuBrain className="text-white text-2xl" />
            </div>
            <h5 className="text-lg font-bold text-[var(--color-text)]">
              AI Financial Insights
            </h5>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 dark:border-primary/10 border-t-primary mx-auto mb-4"></div>
            <p className="text-[var(--color-text)] opacity-60 font-medium">
              Analyzing your financial data...
            </p>
            <p className="text-sm text-[var(--color-text)] opacity-40 mt-2">
              This may take a few seconds
            </p>
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
      <div className="bg-[var(--color-card)] rounded-2xl shadow-sm p-6 border border-[var(--color-border)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl">
              <LuBrain className="text-white text-xl sm:text-2xl" />
            </div>
            <div>
              <h5 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text)]">
                AI Financial Insights
              </h5>
              <p className="text-xs sm:text-sm text-[var(--color-text)] opacity-60 font-medium">
                Powered by Gemini AI
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg disabled:opacity-50"
            title={usageStats ? `${usageStats.insights.remaining} insights remaining` : 'Generate new insights'}
          >
            <LuRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            <span>Generate New</span>
          </button>
        </div>

        {/* Financial Health Score */}
        {financialHealthScore && (
          <div className="bg-[var(--color-input)] rounded-xl p-5 mb-6 border border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-base text-primary font-bold mb-1">
                  Financial Health Score
                </p>
                <p className="text-5xl font-extrabold text-[#D4AF37]">
                  {financialHealthScore.score}/100
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-4 py-2 rounded-full text-base font-bold ${financialHealthScore.rating === "excellent"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : financialHealthScore.rating === "good"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      : financialHealthScore.rating === "fair"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                >
                  {financialHealthScore.rating.toUpperCase()}
                </span>
              </div>
            </div>
            {financialHealthScore.breakdown && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div className="bg-white/60 dark:bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-sm text-primary font-bold mb-1">
                    Savings
                  </p>
                  <p className="text-xl font-extrabold text-[var(--color-text)]">
                    {financialHealthScore.breakdown.savingsRate}
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-sm text-primary font-bold mb-1">
                    Control
                  </p>
                  <p className="text-xl font-extrabold text-[var(--color-text)]">
                    {financialHealthScore.breakdown.expenseControl}
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-sm text-primary font-bold mb-1">
                    Income
                  </p>
                  <p className="text-xl font-extrabold text-[var(--color-text)]">
                    {financialHealthScore.breakdown.incomeStability}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Next Month Prediction */}
        {nextMonthExpensePrediction && (
          <div className="mb-6">
            <div className="flex items-center justify-between bg-[var(--color-input)] rounded-xl p-4 border border-[var(--color-border)]">
              <div>
                <p className="text-base text-[var(--color-text)] font-bold mb-1 opacity-80">
                  Next Month Predicted Expenses
                </p>
                <p className="text-3xl font-extrabold text-[var(--color-text)]">
                  ₹
                  {addThousandsSeparator(
                    Math.round(nextMonthExpensePrediction.total),
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  {nextMonthExpensePrediction.trend === "increasing" ? (
                    <LuTrendingUp className="text-red-500 text-2xl" />
                  ) : nextMonthExpensePrediction.trend === "decreasing" ? (
                    <LuTrendingDown className="text-green-500 text-2xl" />
                  ) : null}
                  <span
                    className={`text-base font-bold ${nextMonthExpensePrediction.trend === "increasing"
                      ? "text-red-600 dark:text-red-400"
                      : nextMonthExpensePrediction.trend === "decreasing"
                        ? "text-green-600 dark:text-green-400"
                        : "text-[var(--color-text)]"
                      }`}
                  >
                    {nextMonthExpensePrediction.trend}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text)] opacity-60 font-semibold">
                  Confidence: {nextMonthExpensePrediction.confidence}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning Flags */}
        {warningFlags && warningFlags.length > 0 && (
          <div className="mb-6">
            <h6 className="text-lg font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
              <span className="text-red-500 text-2xl">⚠️</span>
              Alerts & Warnings
            </h6>
            <div className="space-y-2">
              {warningFlags.map((warning, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 items-start bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3"
                >
                  <span className="text-red-500 dark:text-red-400 font-bold text-2xl">⚠️</span>
                  <p className="text-base text-red-800 dark:text-red-200 font-medium">
                    {warning}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overspending Categories */}
        {spendingAnalysis?.overSpendingCategories &&
          spendingAnalysis.overSpendingCategories.length > 0 && (
            <div className="mb-6">
              <h6 className="text-lg font-bold text-[var(--color-text)] mb-3">
                Categories to Control
              </h6>
              <div className="space-y-3">
                {spendingAnalysis.overSpendingCategories.map((cat, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 bg-[var(--color-input)] border-[var(--color-border)] ${cat.severity === "high"
                      ? "border-l-red-500"
                      : cat.severity === "medium"
                        ? "border-l-yellow-500"
                        : "border-l-orange-500"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-base font-bold text-[var(--color-text)]">
                        {cat.category}
                      </p>
                      <span
                        className={`text-sm px-2 py-1 rounded-full font-bold ${cat.severity === "high"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : cat.severity === "medium"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                          }`}
                      >
                        {cat.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                      <div>
                        <p className="text-sm text-[var(--color-text)] opacity-60 font-medium">
                          Current Spending
                        </p>
                        <p className="text-lg font-extrabold text-[var(--color-text)]">
                          ₹
                          {addThousandsSeparator(
                            Math.round(cat.currentSpending),
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--color-text)] opacity-60 font-medium">
                          Recommended
                        </p>
                        <p className="text-lg font-extrabold text-green-700 dark:text-green-400">
                          ₹
                          {addThousandsSeparator(
                            Math.round(cat.recommendedBudget),
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 rounded px-3 py-2">
                      <p className="text-sm text-[var(--color-text)] font-medium">
                        💡 Potential Savings:{" "}
                        <span className="text-base font-extrabold text-green-700 dark:text-green-400">
                          ₹
                          {addThousandsSeparator(
                            Math.round(cat.savingsPotential),
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Efficient Categories */}
        {spendingAnalysis?.efficientCategories &&
          spendingAnalysis.efficientCategories.length > 0 && (
            <div className="mb-6">
              <h6 className="text-lg font-bold text-[var(--color-text)] mb-3 flex items-center gap-2">
                <span className="text-green-500 text-2xl">✓</span>
                Well-Managed Categories
              </h6>
              <div className="flex flex-wrap gap-2">
                {spendingAnalysis.efficientCategories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-base font-bold border border-green-200 dark:border-green-800/30"
                  >
                    ✓ {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="mb-6">
            <h6 className="text-lg font-bold text-[var(--color-text)] mb-3">
              AI Recommendations
            </h6>
            <div className="space-y-3">
              {recommendations.slice(0, 5).map((rec, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 items-start p-4 rounded-lg bg-[var(--color-input)] border-2 ${rec.priority === "high"
                    ? "border-primary/30 dark:border-primary/50"
                    : rec.priority === "medium"
                      ? "border-blue-300 dark:border-blue-800"
                      : "border-gray-300 dark:border-gray-700"
                    }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {rec.type === "reduce" && (
                      <span className="text-red-500 font-bold text-xl">🔻</span>
                    )}
                    {rec.type === "maintain" && (
                      <span className="text-green-500 font-bold text-xl">
                        ✅
                      </span>
                    )}
                    {rec.type === "optimize" && (
                      <span className="text-blue-500 font-bold text-xl">
                        💡
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {rec.category && (
                        <span className="text-sm font-bold text-[var(--color-text)]">
                          {rec.category}
                        </span>
                      )}
                      {rec.priority === "high" && (
                        <span className="text-xs px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-full font-bold">
                          HIGH PRIORITY
                        </span>
                      )}
                    </div>
                    <p className="text-base text-[var(--color-text)] opacity-90 font-medium">
                      {rec.message}
                    </p>
                    {rec.potentialSavings > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-400 font-bold mt-1">
                        Save up to ₹
                        {addThousandsSeparator(
                          Math.round(rec.potentialSavings),
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* General Insights */}
        {insights && insights.length > 0 && (
          <div>
            <h6 className="text-lg font-bold text-[var(--color-text)] mb-3">
              Key Insights
            </h6>
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 items-start bg-[var(--color-input)] rounded-lg p-4 border border-[var(--color-border)]"
                >
                  <span className="text-primary font-bold text-xl">
                    •
                  </span>
                  <p className="text-base text-[var(--color-text)] font-medium">
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
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-2">
            AI Insights
          </h1>
          <p className="text-[var(--color-text)] opacity-60">
            Get personalized financial suggestions and analysis powered by AI
          </p>
        </div>

        {/* Usage Stats Header */}
        {usageStats && (
          <div className="bg-[var(--color-input)] rounded-xl p-4 mb-6 border border-[var(--color-border)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Daily AI Usage</h3>
                <p className="text-xs text-[var(--color-text)] opacity-60">Limits reset at midnight</p>
              </div>
              <div className="flex gap-4 sm:gap-6 w-full sm:w-auto justify-around sm:justify-end">
                <div className="text-center">
                  <p className="text-xs text-[var(--color-text)] opacity-60 mb-1">AI Insights</p>
                  <p className="text-lg sm:text-xl font-bold text-primary">
                    {usageStats.insights.used}/{usageStats.insights.limit}
                  </p>
                  <p className="text-xs text-[var(--color-text)] opacity-50">
                    {usageStats.insights.remaining} left
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--color-text)] opacity-60 mb-1">Bill Scans</p>
                  <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                    {usageStats.billScans.used}/{usageStats.billScans.limit}
                  </p>
                  <p className="text-xs text-[var(--color-text)] opacity-50">
                    {usageStats.billScans.remaining} left
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {renderContent()}
      </div>
    </DashboardLayout>
  );
};

export default AIInsights;
