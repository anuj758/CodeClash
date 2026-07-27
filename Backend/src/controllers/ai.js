const { GoogleGenAI } = require("@google/genai");
const Problem = require("../models/problem");

// Initialize Gemini client using your environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const chatWithAI = async (req, res) => {
  try {
    const { problemNumber, code, language, query } = req.body;

    // 1. Basic request validation
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Query string is required.",
      });
    }

    // 2. Fetch problem details directly from MongoDB to construct rich AI context
    let problemContext = "";
    if (problemNumber) {
      const problem = await Problem.findOne({
        problemNumber: parseInt(problemNumber, 10),
      })
        .select("title description constraints")
        .lean();

      if (problem) {
        problemContext = `
Problem Title: ${problem.title}
Problem Description: ${problem.description}
Constraints: ${problem.constraints ? problem.constraints.join(", ") : "None"}
`;
      }
    }

    // 3. System Instruction guiding AI assistant behavior
    const systemInstruction = `
You are an expert Competitive Programming and Coding Assistant on the CodeClash platform.
Your goal is to guide students step-by-step. 
Give constructive hints, point out potential edge cases, and analyze space/time complexity. 
Do not reveal full code solutions directly unless the user explicitly asks for code.

${problemContext}

User's Current Code (${language || "Unknown Compiler"}):
\`\`\`
${code || "// No code written yet"}
\`\`\`
`;

    // 4. Request generation using model string: gemini-3.5-flash-lite
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: query,
      config: {
        systemInstruction,
      },
    });

    return res.status(200).json({
      success: true,
      reply: response.text,
    });
  } catch (err) {
    console.error("AI Controller Error:", err);

    // 5. Handle HTTP 429 Quota Exceeded gracefully
    if (
      err.status === 429 ||
      err.message?.includes("429") ||
      err.message?.includes("Quota exceeded")
    ) {
      return res.status(429).json({
        success: false,
        message:
          "AI Assistant rate limit reached. Please wait ~30-60 seconds before asking again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to communicate with AI Assistant",
      error: err.message,
    });
  }
};

module.exports = { chatWithAI };
