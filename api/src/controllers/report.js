const express = require("express");
const passport = require("passport");
const router = express.Router();

const { sendDailyBudgetReport } = require("../utils/dailyBudgetReport");
const { capture } = require("../services/sentry");

const SERVER_ERROR = "SERVER_ERROR";

// Trigger daily budget report manually (admin only)
router.post("/daily-budget", passport.authenticate("admin", { session: false }), async (req, res) => {
  try {
    await sendDailyBudgetReport();
    return res.status(200).send({ ok: true, message: "Daily budget report sent successfully" });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;
