/**
 * Bill Scan Service — OpenRouter API (vision)
 * Uses a fallback chain of vision-capable models.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Vision-capable models in fallback order
const VISION_MODELS = [
  "google/gemini-2.0-flash-001",
  "google/gemini-flash-1.5",
  "google/gemini-pro-1.5",
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3-haiku",
  "anthropic/claude-3-sonnet",
  "meta-llama/llama-3.2-11b-vision-instruct:free",
  "qwen/qwen-2-vl-7b-instruct:free",
  "mistralai/pixtral-12b",
];

/**
 * Validate API key presence
 */
const validateApiKey = () => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key.includes("YOUR-API-KEY-HERE")) {
    throw new Error(
      "OpenRouter API Key is missing or invalid. Please update your .env file."
    );
  }
  return key;
};

/**
 * Call a single vision model with image + text prompt.
 */
const callVisionModel = async (model, prompt, dataUrl, apiKey) => {
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
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.1,
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

/**
 * Parse JSON safely from AI text response
 */
const parseJsonResponse = (text) => {
  let cleaned = text
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    }
    throw new Error("Could not parse JSON from AI response");
  }
};

/**
 * Scan a bill/receipt image and extract structured data.
 * @param {Buffer} imageBuffer - Raw image buffer
 * @param {string} imageType   - MIME type e.g. "image/jpeg"
 * @returns {Object} { success, data } or { success: false, error }
 */
const scanBillImage = async (imageBuffer, imageType) => {
  try {
    const apiKey = validateApiKey();
    const dataUrl = `data:${imageType};base64,${imageBuffer.toString("base64")}`;

    const prompt = `Analyze this bill/receipt image and extract the following information in JSON format:
{
  "amount": <total amount as number, extract only the final total>,
  "category": <expense category like "Food & Dining", "Transportation", "Shopping", "Healthcare", "Entertainment", "Utilities", "Rent", "Groceries", etc.>,
  "date": <date in YYYY-MM-DD format, if not found use today's date>,
  "merchant": <merchant/vendor name>,
  "items": <brief description of items purchased>
}

Important:
- Extract only the TOTAL/FINAL amount, not subtotals
- Choose the most appropriate category from common expense categories
- If date is not clear, use today's date
- Keep merchant name concise
- Return ONLY valid JSON, no explanations`;

    const errors = [];

    for (const model of VISION_MODELS) {
      try {
        console.log(`Bill Scan: Trying model → ${model}`);
        const text = await callVisionModel(model, prompt, dataUrl, apiKey);
        console.log(`Bill Scan: Success with model → ${model}`);

        const extractedData = parseJsonResponse(text);

        return {
          success: true,
          data: {
            amount: parseFloat(extractedData.amount) || 0,
            category: extractedData.category || "Other",
            date: extractedData.date || new Date().toISOString().split("T")[0],
            merchant: extractedData.merchant || "",
            items: extractedData.items || "",
          },
          modelUsed: model,
        };
      } catch (err) {
        console.warn(`Bill Scan: Model ${model} failed — ${err.message}`);
        errors.push(`${model}: ${err.message}`);
      }
    }

    throw new Error(
      `All ${VISION_MODELS.length} vision models failed.\n${errors.join("\n")}`
    );
  } catch (error) {
    console.error("Error scanning bill:", error.message);
    return {
      success: false,
      error: error.message || "Failed to scan bill image",
    };
  }
};

module.exports = { scanBillImage };
