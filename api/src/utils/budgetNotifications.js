const ProjectObject = require("../models/project");
const ExpenseObject = require("../models/expense");
const brevo = require("../services/brevo");
const { capture } = require("../services/sentry");
const { APP_URL } = require("../config");

/**
 * Check if project is over budget and send notification
 * Call this function after creating/updating an expense
 */
async function checkAndNotifyBudgetStatus(projectId) {
  try {
    const project = await ProjectObject.findOne({ _id: projectId });
    if (!project) return;

    // Calculate total expenses
    const expenses = await ExpenseObject.find({ project_id: projectId });
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const percentage = project.budget > 0 ? (totalSpent / project.budget) * 100 : 0;

    // Send notification if over budget (only once)
    if (percentage >= 100 && totalSpent > project.budget && !project.budget_exceeded_sent) {
      const overspent = totalSpent - project.budget;

      await brevo.sendEmail(
        [{ email: project.owner_email, name: project.owner_name }],
        `🚨 Budget dépassé - ${project.name}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚨 Alerte Budget Dépassé</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #333;">Bonjour ${project.owner_name},</p>
              <p style="font-size: 16px; color: #333;">Le projet <strong>${
                project.name
              }</strong> a dépassé son budget !</p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #666;">Budget prévu</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #3b82f6;">${project.budget.toLocaleString(
                      "fr-FR",
                    )} €</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666;">Total dépensé</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #f59e0b;">${totalSpent.toLocaleString(
                      "fr-FR",
                    )} €</td>
                  </tr>
                  <tr style="border-top: 2px solid #e5e7eb;">
                    <td style="padding: 10px 0; color: #666; font-weight: bold;">Dépassement</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 18px; color: #dc2626;">+${overspent.toLocaleString(
                      "fr-FR",
                    )} € (${percentage.toFixed(0)}%)</td>
                  </tr>
                </table>
              </div>

              <p style="color: #666; font-size: 14px;">
                <strong>Nombre de dépenses :</strong> ${expenses.length}<br>
                <strong>Action recommandée :</strong> Veuillez revoir vos dépenses et ajuster votre budget si nécessaire.
              </p>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${APP_URL || "http://localhost:3000"}/project/${
          project._id
        }" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Voir le projet</a>
              </div>
            </div>
          </div>
        `,
      );

      // Mark as sent
      project.budget_exceeded_sent = true;
      project.budget_warning_sent = true; // Also mark warning as sent
      await project.save();

      console.log(`📧 Email sent: Budget exceeded for project ${project.name}`);
    }
    // Warning notification at 80% (only once)
    else if (percentage >= 80 && percentage < 100 && !project.budget_warning_sent) {
      await brevo.sendEmail(
        [{ email: project.owner_email, name: project.owner_name }],
        `⚠️ Attention au budget - ${project.name}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Attention Budget</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #333;">Bonjour ${project.owner_name},</p>
              <p style="font-size: 16px; color: #333;">Le projet <strong>${
                project.name
              }</strong> approche de son budget limite.</p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #666;">Budget prévu</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #3b82f6;">${project.budget.toLocaleString(
                      "fr-FR",
                    )} €</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666;">Total dépensé</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #f59e0b;">${totalSpent.toLocaleString(
                      "fr-FR",
                    )} €</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #666;">Utilisation</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 18px; color: #f59e0b;">${percentage.toFixed(
                      0,
                    )}%</td>
                  </tr>
                  <tr style="border-top: 2px solid #e5e7eb;">
                    <td style="padding: 10px 0; color: #666; font-weight: bold;">Restant</td>
                    <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #10b981;">${(
                      project.budget - totalSpent
                    ).toLocaleString("fr-FR")} €</td>
                  </tr>
                </table>
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border: 1px solid #fbbf24;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  💡 <strong>Conseil :</strong> Vous avez utilisé ${percentage.toFixed(0)}% de votre budget.
                  Surveillez vos dépenses pour éviter de dépasser la limite.
                </p>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                <strong>Nombre de dépenses :</strong> ${expenses.length}
              </p>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${APP_URL || "http://localhost:3000"}/project/${
          project._id
        }" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Voir le projet</a>
              </div>
            </div>
          </div>
        `,
      );

      // Mark as sent
      project.budget_warning_sent = true;
      await project.save();

      console.log(`📧 Email sent: Budget warning for project ${project.name}`);
    }
  } catch (error) {
    console.error("Error in budget notification:", error);
    capture(error);
  }
}

module.exports = { checkAndNotifyBudgetStatus };
