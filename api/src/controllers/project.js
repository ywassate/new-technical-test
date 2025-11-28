const express = require("express");
const passport = require("passport");
const router = express.Router();

const ProjectObject = require("../models/project");
const { capture } = require("../services/sentry");

const SERVER_ERROR = "SERVER_ERROR";

// Create a new project
router.post("/", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const { name, budget, description } = req.body;

    if (!name) return res.status(400).send({ ok: false, code: "NAME_REQUIRED" });
    if (!budget || budget < 0) return res.status(400).send({ ok: false, code: "VALID_BUDGET_REQUIRED" });

    const data = await ProjectObject.create({
      name,
      budget,
      description,
      owner_id: req.user._id,
      owner_name: req.user.name,
      owner_email: req.user.email,
    });

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// Get a project by ID
router.get("/:id", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const data = await ProjectObject.findOne({ _id: req.params.id });
    if (!data) return res.status(404).send({ ok: false, code: "PROJECT_NOT_FOUND" });

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// Search/List projects with filters
router.post("/search", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const query = {};

    if (req.body.owner_id) query.owner_id = req.body.owner_id;
    if (req.body.status) query.status = req.body.status;
    if (req.body.name) query.name = new RegExp(req.body.name, "i");

    const data = await ProjectObject.find(query).sort({ createdAt: -1 });

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// Update a project
router.put("/:id", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const project = await ProjectObject.findOne({ _id: req.params.id });
    if (!project) return res.status(404).send({ ok: false, code: "PROJECT_NOT_FOUND" });

    // Only owner or admin can update
    if (project.owner_id !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).send({ ok: false, code: "UNAUTHORIZED" });
    }

    const { name, budget, description, status } = req.body;

    if (name !== undefined) project.name = name;
    if (budget !== undefined) project.budget = budget;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;

    await project.save();

    return res.status(200).send({ ok: true, data: project });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// Delete a project
router.delete("/:id", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const project = await ProjectObject.findOne({ _id: req.params.id });
    if (!project) return res.status(404).send({ ok: false, code: "PROJECT_NOT_FOUND" });

    // Only owner or admin can delete
    if (project.owner_id !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).send({ ok: false, code: "UNAUTHORIZED" });
    }

    await project.deleteOne();

    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;
