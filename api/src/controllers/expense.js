const express = require("express");
const passport = require("passport");
const router = express.Router();

const ExpenseObject = require("../models/expense");
const ProjectObject = require("../models/project");
const { capture } = require("../services/sentry");
const { checkAndNotifyBudgetStatus } = require("../utils/budgetNotifications");
const { categorizeExpense } = require("../services/ai");

const SERVER_ERROR = "SERVER_ERROR";

// Create a new expense
router.post("/", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const { project_id, amount, category, description } = req.body;

    if (!project_id) return res.status(400).send({ ok: false, code: "PROJECT_ID_REQUIRED" });
    if (!amount || amount <= 0) return res.status(400).send({ ok: false, code: "VALID_AMOUNT_REQUIRED" });

    // Verify project exists
    const project = await ProjectObject.findOne({ _id: project_id });
    if (!project) return res.status(404).send({ ok: false, code: "PROJECT_NOT_FOUND" });

    const data = await ExpenseObject.create({
      project_id,
      project_name: project.name,
      amount,
      category,
      description,
      created_by_user_id: req.user._id,
      created_by_user_name: req.user.name,
      created_by_user_email: req.user.email,
    });

    // Check budget and send notification if needed
    checkAndNotifyBudgetStatus(project_id).catch((err) => console.error("Budget notification error:", err));

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// Get an expense by ID
router.get("/:id", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const data = await ExpenseObject.findOne({ _id: req.params.id });
    if (!data) return res.status(404).send({ ok: false, code: "EXPENSE_NOT_FOUND" });

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// Search/List expenses with filters
router.post("/search", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const query = {};

    if (req.body.project_id) query.project_id = req.body.project_id;
    if (req.body.created_by_user_id) query.created_by_user_id = req.body.created_by_user_id;
    if (req.body.category) query.category = req.body.category;

    const data = await ExpenseObject.find(query).sort({ createdAt: -1 });

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// Update an expense
router.put("/:id", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const expense = await ExpenseObject.findOne({ _id: req.params.id });
    if (!expense) return res.status(404).send({ ok: false, code: "EXPENSE_NOT_FOUND" });

    // Only creator or admin can update
    if (expense.created_by_user_id !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).send({ ok: false, code: "UNAUTHORIZED" });
    }

    const { amount, category, description } = req.body;

    if (amount !== undefined) expense.amount = amount;
    if (category !== undefined) expense.category = category;
    if (description !== undefined) expense.description = description;

    await expense.save();

    // Check budget if amount was updated
    if (amount !== undefined) {
      checkAndNotifyBudgetStatus(expense.project_id).catch((err) => console.error("Budget notification error:", err));
    }

    return res.status(200).send({ ok: true, data: expense });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// Delete an expense
router.delete("/:id", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const expense = await ExpenseObject.findOne({ _id: req.params.id });
    if (!expense) return res.status(404).send({ ok: false, code: "EXPENSE_NOT_FOUND" });

    // Only creator or admin can delete
    if (expense.created_by_user_id !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).send({ ok: false, code: "UNAUTHORIZED" });
    }

    await expense.deleteOne();

    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// AI: Auto-categorize an expense based on description
router.post("/categorize", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) return res.status(400).send({ ok: false, code: "DESCRIPTION_REQUIRED" });

    const category = await categorizeExpense(description);

    return res.status(200).send({ ok: true, data: { category } });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;
