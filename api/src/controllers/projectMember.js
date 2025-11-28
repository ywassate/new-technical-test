const express = require("express");
const passport = require("passport");
const router = express.Router();

const ProjectMemberObject = require("../models/projectMember");
const ProjectObject = require("../models/project");
const UserObject = require("../models/user");
const { capture } = require("../services/sentry");

const SERVER_ERROR = "SERVER_ERROR";

// Add a member to a project
router.post("/", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const { project_id, user_email, role, can_add_expenses, can_edit_project } = req.body;

    if (!project_id) return res.status(400).send({ ok: false, code: "PROJECT_ID_REQUIRED" });
    if (!user_email) return res.status(400).send({ ok: false, code: "USER_EMAIL_REQUIRED" });

    // Verify project exists
    const project = await ProjectObject.findOne({ _id: project_id });
    if (!project) return res.status(404).send({ ok: false, code: "PROJECT_NOT_FOUND" });

    // Only owner or admin can add members
    if (project.owner_id !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).send({ ok: false, code: "UNAUTHORIZED" });
    }

    // Find user to add
    const userToAdd = await UserObject.findOne({ email: user_email.toLowerCase().trim() });
    if (!userToAdd) return res.status(404).send({ ok: false, code: "USER_NOT_FOUND" });

    // Check if already member
    const existingMember = await ProjectMemberObject.findOne({
      project_id,
      user_id: userToAdd._id.toString(),
    });

    if (existingMember) {
      return res.status(409).send({ ok: false, code: "ALREADY_MEMBER" });
    }

    const data = await ProjectMemberObject.create({
      project_id,
      project_name: project.name,
      user_id: userToAdd._id.toString(),
      user_name: userToAdd.name,
      user_email: userToAdd.email,
      user_avatar: userToAdd.avatar,
      role: role || "member",
      can_add_expenses: can_add_expenses !== undefined ? can_add_expenses : true,
      can_edit_project: can_edit_project !== undefined ? can_edit_project : false,
      added_by_user_id: req.user._id.toString(),
      added_by_user_name: req.user.name,
    });

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// Get all members of a project
router.post("/search", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const query = {};

    if (req.body.project_id) query.project_id = req.body.project_id;
    if (req.body.user_id) query.user_id = req.body.user_id;

    const data = await ProjectMemberObject.find(query).sort({ createdAt: -1 });

    return res.status(200).send({ ok: true, data });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// Update member permissions
router.put("/:id", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const member = await ProjectMemberObject.findOne({ _id: req.params.id });
    if (!member) return res.status(404).send({ ok: false, code: "MEMBER_NOT_FOUND" });

    // Verify user is project owner
    const project = await ProjectObject.findOne({ _id: member.project_id });
    if (!project) return res.status(404).send({ ok: false, code: "PROJECT_NOT_FOUND" });

    if (project.owner_id !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).send({ ok: false, code: "UNAUTHORIZED" });
    }

    const { role, can_add_expenses, can_edit_project } = req.body;

    if (role !== undefined) member.role = role;
    if (can_add_expenses !== undefined) member.can_add_expenses = can_add_expenses;
    if (can_edit_project !== undefined) member.can_edit_project = can_edit_project;

    await member.save();

    return res.status(200).send({ ok: true, data: member });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

// Remove a member from a project
router.delete("/:id", passport.authenticate(["admin", "user"], { session: false }), async (req, res) => {
  try {
    const member = await ProjectMemberObject.findOne({ _id: req.params.id });
    if (!member) return res.status(404).send({ ok: false, code: "MEMBER_NOT_FOUND" });

    // Verify user is project owner
    const project = await ProjectObject.findOne({ _id: member.project_id });
    if (!project) return res.status(404).send({ ok: false, code: "PROJECT_NOT_FOUND" });

    if (project.owner_id !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).send({ ok: false, code: "UNAUTHORIZED" });
    }

    await member.deleteOne();

    return res.status(200).send({ ok: true });
  } catch (error) {
    capture(error);
    res.status(500).send({ ok: false, code: SERVER_ERROR, error });
  }
});

module.exports = router;
