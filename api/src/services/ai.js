const fetch = require("node-fetch");

/**
 * Simple AI service using OpenRouter free models
 * Categorize expenses based on description
 */

const { OPENROUTER_API_KEY } = require("../config");

const CATEGORIES = ["Marketing", "Développement", "Design", "Infrastructure", "RH", "Autre"];

async function categorizeExpense(description) {
  // Fallback to simple keyword matching if no API key
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === "") {
    return categorizeWithKeywords(description);
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5-8b",
        messages: [
          {
            role: "user",
            content: `Catégorise cette dépense en UNE SEULE catégorie parmi: ${CATEGORIES.join(", ")}.

Description de la dépense: "${description}"

Réponds UNIQUEMENT par le nom de la catégorie, rien d'autre.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const category = data.choices?.[0]?.message?.content?.trim();

    // Verify category is valid
    if (category && CATEGORIES.includes(category)) {
      return category;
    }

    // Fallback to keyword matching
    return categorizeWithKeywords(description);
  } catch (error) {
    console.error("AI categorization error:", error);
    return categorizeWithKeywords(description);
  }
}

/**
 * Simple keyword-based categorization (fallback)
 */
function categorizeWithKeywords(description) {
  if (!description) return "Autre";

  const desc = description.toLowerCase();

  const keywords = {
    Marketing: [
      "marketing",
      "pub",
      "publicité",
      "facebook",
      "google ads",
      "instagram",
      "campagne",
      "seo",
      "social media",
    ],
    Développement: ["dev", "développement", "code", "api", "serveur", "hosting", "github", "aws", "cloud"],
    Design: ["design", "graphique", "logo", "ui", "ux", "figma", "photoshop", "illustration"],
    Infrastructure: ["infrastructure", "serveur", "hébergement", "domaine", "ssl", "backup", "sécurité"],
    RH: ["salaire", "recrutement", "formation", "rh", "employé", "freelance", "prestataire"],
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((word) => desc.includes(word))) {
      return category;
    }
  }

  return "Autre";
}

/**
 * Generate a personalized budget alert message
 */
async function generateBudgetAlertMessage(projectName, budget, totalSpent, percentage) {
  // Simple template-based approach (works without API key)
  const overspent = totalSpent - budget;

  if (percentage >= 100) {
    return `🚨 Attention ! Votre projet "${projectName}" a dépassé son budget de ${overspent.toLocaleString(
      "fr-FR",
    )} € (${percentage.toFixed(0)}%). Il est temps de revoir vos dépenses !`;
  }

  if (percentage >= 90) {
    return `⚠️ Alerte ! Le projet "${projectName}" a consommé ${percentage.toFixed(
      0,
    )}% de son budget. Il ne reste que ${(budget - totalSpent).toLocaleString("fr-FR")} €.`;
  }

  if (percentage >= 80) {
    return `💡 Attention, le projet "${projectName}" approche de son budget limite (${percentage.toFixed(
      0,
    )}% utilisé). Restant : ${(budget - totalSpent).toLocaleString("fr-FR")} €.`;
  }

  return `✅ Le projet "${projectName}" est sous contrôle (${percentage.toFixed(0)}% du budget utilisé).`;
}

module.exports = {
  categorizeExpense,
  generateBudgetAlertMessage,
};
