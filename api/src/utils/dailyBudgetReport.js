const ProjectObject = require("../models/project");
const ExpenseObject = require("../models/expense");
const UserObject = require("../models/user");
const brevo = require("../services/brevo");
const { capture } = require("../services/sentry");
const { APP_URL } = require("../config");
/**
 * Generate and send daily budget report
 * Lists all projects at risk (>80%) or over budget (>100%)
 * Should be called via cron job daily
 */
async function sendDailyBudgetReport() {
  try {
    console.log("📊 Generating daily budget report...");

    // Get all active projects
    const projects = await ProjectObject.find({ status: "active" });
    if (!projects.length) {
      console.log("No active projects found");
      return;
    }

    // Get all expenses
    const allExpenses = await ExpenseObject.find({});

    // Calculate budget status for each project
    const projectsWithStatus = projects.map((project) => {
      const expenses = allExpenses.filter((e) => e.project_id === project._id.toString());
      const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
      const percentage = project.budget > 0 ? (totalSpent / project.budget) * 100 : 0;

      return {
        project,
        expenses: expenses.length,
        totalSpent,
        percentage,
        remaining: project.budget - totalSpent,
        status: percentage >= 100 ? "over" : percentage >= 80 ? "warning" : percentage >= 50 ? "moderate" : "ok",
      };
    });

    // Filter projects at risk or over budget
    const atRiskProjects = projectsWithStatus.filter((p) => p.percentage >= 80);

    if (!atRiskProjects.length) {
      console.log("No projects at risk - daily report skipped");
      return;
    }

    // Group projects by owner
    const projectsByOwner = {};
    atRiskProjects.forEach((p) => {
      const ownerId = p.project.owner_id;
      if (!projectsByOwner[ownerId]) {
        projectsByOwner[ownerId] = {
          owner_name: p.project.owner_name,
          owner_email: p.project.owner_email,
          projects: [],
        };
      }
      projectsByOwner[ownerId].projects.push(p);
    });

    // Send report to each owner
    let emailsSent = 0;
    for (const [ownerId, data] of Object.entries(projectsByOwner)) {
      await sendReportToOwner(data.owner_email, data.owner_name, data.projects);
      emailsSent++;
    }

    console.log(`✅ Daily budget report sent to ${emailsSent} users`);
    console.log(`   Total projects at risk: ${atRiskProjects.length}`);
  } catch (error) {
    console.error("Error in daily budget report:", error);
    capture(error);
  }
}

/**
 * Send budget report to a specific owner
 */
async function sendReportToOwner(ownerEmail, ownerName, projects) {
  const overBudget = projects.filter((p) => p.status === "over");
  const atRisk = projects.filter((p) => p.status === "warning");

  // Generate project rows HTML
  const projectRows = projects
    .sort((a, b) => b.percentage - a.percentage) // Sort by percentage descending
    .map((p) => {
      const statusColor = p.status === "over" ? "#dc2626" : "#f59e0b";
      const statusText = p.status === "over" ? "Dépassé" : "À risque";
      const statusBg = p.status === "over" ? "#fee2e2" : "#fef3c7";

      return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 15px 10px;">
          <div style="font-weight: bold; color: #111827; margin-bottom: 4px;">${p.project.name}</div>
          <div style="font-size: 12px; color: #6b7280;">${p.expenses} dépenses</div>
        </td>
        <td style="padding: 15px 10px; text-align: right;">
          <div style="font-weight: bold; color: #3b82f6;">${p.project.budget.toLocaleString("fr-FR")} €</div>
        </td>
        <td style="padding: 15px 10px; text-align: right;">
          <div style="font-weight: bold; color: ${
            p.status === "over" ? "#dc2626" : "#f59e0b"
          };">${p.totalSpent.toLocaleString("fr-FR")} €</div>
        </td>
        <td style="padding: 15px 10px; text-align: right;">
          <div style="display: inline-block; background: ${statusBg}; color: ${statusColor}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
            ${Math.round(p.percentage)}% - ${statusText}
          </div>
        </td>
      </tr>
    `;
    })
    .join("");

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 32px;">📊 Rapport Budgétaire Quotidien</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${new Date().toLocaleDateString(
          "fr-FR",
          { weekday: "long", year: "numeric", month: "long", day: "numeric" },
        )}</p>
      </div>

      <!-- Content -->
      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Bonjour ${ownerName},</p>

        <p style="font-size: 16px; color: #333; margin-bottom: 30px;">
          Voici le résumé de vos projets nécessitant une attention particulière :
        </p>

        <!-- Stats Summary -->
        <div style="display: flex; gap: 15px; margin-bottom: 30px;">
          <div style="flex: 1; background: white; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #dc2626;">
            <div style="font-size: 28px; font-weight: bold; color: #dc2626; margin-bottom: 5px;">${
              overBudget.length
            }</div>
            <div style="font-size: 14px; color: #6b7280;">Budget dépassé</div>
          </div>
          <div style="flex: 1; background: white; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #f59e0b;">
            <div style="font-size: 28px; font-weight: bold; color: #f59e0b; margin-bottom: 5px;">${atRisk.length}</div>
            <div style="font-size: 14px; color: #6b7280;">À risque (≥80%)</div>
          </div>
        </div>

        <!-- Projects Table -->
        <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 15px 10px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Projet</th>
                <th style="padding: 15px 10px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Budget</th>
                <th style="padding: 15px 10px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Dépensé</th>
                <th style="padding: 15px 10px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${projectRows}
            </tbody>
          </table>
        </div>

        <!-- Call to Action -->
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 30px; border: 1px solid #dbeafe;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>💡 Recommandation :</strong> Consultez vos projets et ajustez vos budgets si nécessaire pour éviter tout dépassement supplémentaire.
          </p>
        </div>

        <!-- Button -->
        <div style="text-align: center; margin-top: 30px;">
          <a href="${
            APP_URL || "http://localhost:3000"
          }/projects" style="background: #3b82f6; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
            Voir tous mes projets
          </a>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Ce rapport est généré automatiquement chaque jour.<br>
            Budget Tracker - Gestion de budget simplifiée
          </p>
        </div>
      </div>
    </div>
  `;

  await brevo.sendEmail(
    [{ email: ownerEmail, name: ownerName }],
    `📊 Rapport budgétaire quotidien - ${projects.length} projet${projects.length > 1 ? "s" : ""} à surveiller`,
    htmlContent,
  );

  console.log(`   ✉️  Report sent to ${ownerEmail} (${projects.length} projects)`);
}

module.exports = { sendDailyBudgetReport, sendReportToOwner };
