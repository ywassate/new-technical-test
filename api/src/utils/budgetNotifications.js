const ProjectObject = require("../models/project");
const ExpenseObject = require("../models/expense");
const brevo = require("../services/brevo");
const { capture } = require("../services/sentry");

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

    // Send notification if over budget (only if crossing 100% threshold)
    if (percentage >= 100 && totalSpent > project.budget) {
      const overspent = totalSpent - project.budget;

      await brevo.sendEmail({
        to: [{ email: project.owner_email, name: project.owner_name }],
        subject: ` Budget dépassé - ${project.name}`,
        htmlContent: `
          <h2>Alerte Budget</h2>
          <p>Bonjour ${project.owner_name},</p>
          <p>Le projet <strong>${project.name}</strong> a dépassé son budget !</p>
          <ul>
            <li>Budget prévu : <strong>${project.budget.toLocaleString("fr-FR")} €</strong></li>
            <li>Total dépensé : <strong>${totalSpent.toLocaleString("fr-FR")} €</strong></li>
            <li>Dépassement : <strong style="color: red;">+${overspent.toLocaleString(
              "fr-FR",
            )} €</strong> (${percentage.toFixed(0)}%)</li>
          </ul>
          <p>Nombre de dépenses : ${expenses.length}</p>
          <p>Consultez votre projet pour plus de détails.</p>
        `,
      });

      console.log(`📧 Email sent: Budget exceeded for project ${project.name}`);
    }

    // Warning notification at 80%
    if (percentage >= 80 && percentage < 100) {
      await brevo.sendEmail({
        to: [{ email: project.owner_email, name: project.owner_name }],
        subject: `Attention au budget - ${project.name}`,
        htmlContent: `
          <h2>Attention Budget</h2>
          <p>Bonjour ${project.owner_name},</p>
          <p>Le projet <strong>${project.name}</strong> approche de son budget limite.</p>
          <ul>
            <li>Budget prévu : <strong>${project.budget.toLocaleString("fr-FR")} €</strong></li>
            <li>Total dépensé : <strong>${totalSpent.toLocaleString("fr-FR")} €</strong></li>
            <li>Utilisation : <strong style="color: orange;">${percentage.toFixed(0)}%</strong></li>
            <li>Restant : <strong>${(project.budget - totalSpent).toLocaleString("fr-FR")} €</strong></li>
          </ul>
          <p>Nombre de dépenses : ${expenses.length}</p>
        `,
      });

      console.log(`📧 Email sent: Budget warning for project ${project.name}`);
    }
  } catch (error) {
    console.error("Error in budget notification:", error);
    capture(error);
  }
}

module.exports = { checkAndNotifyBudgetStatus };
