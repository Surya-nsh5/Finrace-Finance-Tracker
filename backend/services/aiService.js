/**
 * AI Service — OpenRouter API
 * Uses a fallback chain of 10 models so if one fails the next is tried automatically.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Ordered fallback list — text-only models (no vision needed here)
const TEXT_MODELS = [
  "google/gemini-2.0-flash-001",
  "google/gemini-flash-1.5",
  "google/gemini-pro-1.5",
  "openai/gpt-4o-mini",
  "openai/gpt-3.5-turbo",
  "anthropic/claude-3-haiku",
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "qwen/qwen-2.5-7b-instruct:free",
  "deepseek/deepseek-chat",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const validateApiKey = () => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key.includes("YOUR-API-KEY-HERE")) {
    throw new Error(
      "OpenRouter API Key is missing or invalid. Please update your .env file."
    );
  }
  return key;
};

const callModel = async (model, prompt, apiKey) => {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://finrace.app",
      "X-Title": "FinRace",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Model ${model} failed [${response.status}]: ${body}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Model ${model} returned empty content`);
  return content;
};

const callOpenRouterWithFallback = async (prompt, models = TEXT_MODELS) => {
  const apiKey = validateApiKey();
  const errors = [];

  for (const model of models) {
    try {
      console.log(`AI Service: Trying model -> ${model}`);
      const text = await callModel(model, prompt, apiKey);
      console.log(`AI Service: Success with model -> ${model}`);
      return { text, model };
    } catch (err) {
      console.warn(`AI Service: Model ${model} failed - ${err.message}`);
      errors.push(`${model}: ${err.message}`);
    }
  }

  throw new Error(
    `All ${models.length} AI models failed.\n${errors.join("\n")}`
  );
};

const parseJsonResponse = (text) => {
  let cleaned = text
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return JSON.parse(cleaned);
};

// ─────────────────────────────────────────────────────────────────────────────
// Exported service functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate comprehensive financial analysis and predictions
 */
exports.generateFinancialAnalysis = async (financialData) => {
  const prompt = [
    "You are an expert financial advisor AI for Indian users. Analyze this user's financial data (Income vs Expenses) and provide comprehensive insights.",
    "Focus on actionable advice to save money based on their income level.",
    "",
    "USER FINANCIAL DATA:",
    JSON.stringify(financialData, null, 2),
    "",
    "Respond in VALID JSON format only (no markdown, no code blocks):",
    JSON.stringify({
      nextMonthExpensePrediction: {
        total: "<number>",
        confidence: "<number 0-100>",
        trend: "increasing|decreasing|stable"
      },
      categoryPredictions: [{
        category: "<string>",
        predictedAmount: "<number>",
        currentAverage: "<number>",
        trend: "increasing|decreasing|stable",
        confidence: "<number 0-100>"
      }],
      spendingAnalysis: {
        overSpendingCategories: [{
          category: "<string>",
          currentSpending: "<number>",
          recommendedBudget: "<number>",
          savingsPotential: "<number>",
          severity: "high|medium|low"
        }],
        efficientCategories: ["<category names>"]
      },
      recommendations: [{
        type: "reduce|maintain|optimize",
        category: "<string>",
        message: "<actionable advice using INR amounts with Rs. prefix>",
        priority: "high|medium|low",
        potentialSavings: "<number>"
      }],
      financialHealthScore: {
        score: "<number 0-100>",
        rating: "excellent|good|fair|poor",
        breakdown: {
          savingsRate: "<number 0-100>",
          expenseControl: "<number 0-100>",
          incomeStability: "<number 0-100>"
        }
      },
      insights: ["<insight using Rs. for currency, never $ or USD>"],
      warningFlags: ["<warning using Rs. for currency, never $ or USD>"]
    }, null, 2),
    "",
    "RULES:",
    "1. Return ONLY valid JSON — no markdown, no code blocks.",
    "2. All numeric fields must be plain numbers (no currency symbols in number fields).",
    "3. In ALL text/string fields (insights, warningFlags, message, issue, recommendation, reasoning, overallAssessment, actionPlan): use Rs. or INR for currency — NEVER use $ or USD.",
    "4. Be specific with numbers based on the actual data.",
    "5. Identify categories spending more than 20% above average.",
    "6. Flag unusual spending patterns or spikes."
  ].join("\n");

  try {
    const { text, model } = await callOpenRouterWithFallback(prompt);
    const jsonData = parseJsonResponse(text);
    return {
      success: true,
      data: jsonData,
      generatedAt: new Date(),
      modelUsed: model,
    };
  } catch (error) {
    console.error("generateFinancialAnalysis error:", error.message);
    throw new Error(`AI Analysis failed: ${error.message}`);
  }
};

/**
 * Generate quick expense prediction for next month
 */
exports.predictNextMonthExpenses = async (expenseData) => {
  const prompt = [
    "Analyze this expense history and predict next month's total expenses for an Indian user.",
    "",
    "EXPENSE DATA:",
    JSON.stringify(expenseData, null, 2),
    "",
    "Respond in VALID JSON format only (no markdown):",
    '{ "predictedTotal": <number>, "confidence": <number 0-100>, "reasoning": "<use Rs. for currency, never $>", "categoryBreakdown": [{"category": "<string>", "amount": <number>}] }',
    "",
    "RULES: Return ONLY valid JSON. Use Rs. or INR in text fields — never $ or USD."
  ].join("\n");

  try {
    const { text } = await callOpenRouterWithFallback(prompt);
    return parseJsonResponse(text);
  } catch (error) {
    console.error("predictNextMonthExpenses error:", error.message);
    throw new Error(`Expense prediction failed: ${error.message}`);
  }
};

/**
 * Analyze spending patterns and identify areas of concern
 */
exports.analyzeSpendingPatterns = async (spendingData) => {
  const prompt = [
    "You are a financial advisor for Indian users. Analyze this spending pattern and identify where the user should control expenses.",
    "",
    "SPENDING DATA:",
    JSON.stringify(spendingData, null, 2),
    "",
    "Respond in VALID JSON format only (no markdown):",
    '{ "criticalCategories": [{"category": "<string>", "issue": "<use Rs. not $>", "recommendation": "<use Rs. not $>", "targetReduction": <number>}], "healthyCategories": ["<string>"], "overallAssessment": "<use Rs. not $>", "actionPlan": ["<use Rs. not $>"] }',
    "",
    "RULES: Return ONLY valid JSON. Use Rs. or INR in all text fields — never $ or USD."
  ].join("\n");

  try {
    const { text } = await callOpenRouterWithFallback(prompt);
    return parseJsonResponse(text);
  } catch (error) {
    console.error("analyzeSpendingPatterns error:", error.message);
    throw new Error(`Spending analysis failed: ${error.message}`);
  }
};
