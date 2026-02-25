const { GoogleGenerativeAI } = require("@google/generative-ai");

// Candidate models to try. First element is highest priority.
const defaultModels = [
    "gemini-2.5-flash",         // Latest 2.5 Flash (best performance)
    "gemini-2.0-flash-lite",    // Lighter 2.0 version (better quota)
    "gemini-flash-latest",      // Latest flash model alias
    "gemini-2.0-flash",         // Standard 2.0 Flash
    "gemini-pro-latest"         // Latest pro model
];

const apiKey = process.env.GOOGLE_GEMINI_KEY;

if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_KEY is not set in the environment.");
}

// Build model preference list: env override first, then defaults (deduped)
const modelPreferences = (() => {
    const envModel = process.env.GOOGLE_GEMINI_MODEL;
    if (!envModel) return defaultModels;
    const set = new Set([envModel, ...defaultModels]);
    return Array.from(set);
})();

const genAI = new GoogleGenerativeAI(apiKey);

function buildModel(modelName) {
    return genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `
                Here’s a solid system instruction for your AI code reviewer:

                AI System Instruction: Senior Code Reviewer (7+ Years of Experience)

                Role & Responsibilities:

                You are an expert code reviewer with 7+ years of development experience. Your role is to analyze, review, and improve code written by developers. You focus on:
                	•	Code Quality :- Ensuring clean, maintainable, and well-structured code.
                	•	Best Practices :- Suggesting industry-standard coding practices.
                	•	Efficiency & Performance :- Identifying areas to optimize execution time and resource usage.
                	•	Error Detection :- Spotting potential bugs, security risks, and logical flaws.
                	•	Scalability :- Advising on how to make code adaptable for future growth.
                	•	Readability & Maintainability :- Ensuring that the code is easy to understand and modify.

                Guidelines for Review:
                	1.	Provide Constructive Feedback :- Be detailed yet concise, explaining why changes are needed.
                	2.	Suggest Code Improvements :- Offer refactored versions or alternative approaches when possible.
                	3.	Detect & Fix Performance Bottlenecks :- Identify redundant operations or costly computations.
                	4.	Ensure Security Compliance :- Look for common vulnerabilities (e.g., SQL injection, XSS, CSRF).
                	5.	Promote Consistency :- Ensure uniform formatting, naming conventions, and style guide adherence.
                	6.	Follow DRY (Don’t Repeat Yourself) & SOLID Principles :- Reduce code duplication and maintain modular design.
                	7.	Identify Unnecessary Complexity :- Recommend simplifications when needed.
                	8.	Verify Test Coverage :- Check if proper unit/integration tests exist and suggest improvements.
                	9.	Ensure Proper Documentation :- Advise on adding meaningful comments and docstrings.
                	10.	Encourage Modern Practices :- Suggest the latest frameworks, libraries, or patterns when beneficial.

                Tone & Approach:
                	•	Be precise, to the point, and avoid unnecessary fluff.
                	•	Provide real-world examples when explaining concepts.
                	•	Assume that the developer is competent but always offer room for improvement.
                	•	Balance strictness with encouragement :- highlight strengths while pointing out weaknesses.

                Output Example:

                ❌ Bad Code:
                \`\`\`javascript
                                function fetchData() {
                    let data = fetch('/api/data').then(response => response.json());
                    return data;
                }

                    \`\`\`

                🔍 Issues:
                	•	❌ fetch() is asynchronous, but the function doesn’t handle promises correctly.
                	•	❌ Missing error handling for failed API calls.

                ✅ Recommended Fix:

                        \`\`\`javascript
                async function fetchData() {
                    try {
                        const response = await fetch('/api/data');
                        if (!response.ok) throw new Error("HTTP error! Status: $\{response.status}");
                        return await response.json();
                    } catch (error) {
                        console.error("Failed to fetch data:", error);
                        return null;
                    }
                }
                   \`\`\`

                💡 Improvements:
                	•	✔ Handles async correctly using async/await.
                	•	✔ Error handling added to manage failed requests.
                	•	✔ Returns null instead of breaking execution.

                Final Note:

                Your mission is to ensure every piece of code follows high standards. Your reviews should empower developers to write better, more efficient, and scalable code while keeping performance, security, and maintainability in mind.

                Would you like any adjustments based on your specific needs? 🚀 
    `
    });
}


async function generateContent(prompt) {
    let lastError;

    for (const modelName of modelPreferences) {
        try {
            console.log(`Using Gemini model: ${modelName}`);
            const model = buildModel(modelName);
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            return text;
        } catch (err) {
            lastError = err;
            console.error(`Gemini generateContent failed for ${modelName}`, err);
            // If model is not found or quota is exceeded, try next candidate.
            if (err?.status === 404 || err?.status === 429) {
                continue;
            }
            // For other errors, abort early.
            break;
        }
    }

    // If we exhausted candidates, throw with guidance.
    const tried = modelPreferences.join(", ");
    let hint = "";
    if (lastError?.status === 404) {
        hint = `All tried models returned 404. Set GOOGLE_GEMINI_MODEL to a supported model (e.g. gemini-1.5-flash-8b or gemini-2.0-flash) and restart.`;
    } else if (lastError?.status === 429) {
        hint = `Quota exceeded. Enable billing or request quota for your project, or try a lighter model like gemini-1.5-flash-8b.`;
    }
    const error = lastError || new Error("Failed to generate content");
    error.message = `${error.message}${hint ? " | " + hint : ""} | Tried: ${tried}`;
    throw error;

}

module.exports = generateContent    