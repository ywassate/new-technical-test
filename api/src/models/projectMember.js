const mongoose = require("mongoose");

const MODELNAME = "projectMember";

const Schema = new mongoose.Schema({
  // Flat data structure
  project_id: { type: String, required: true },
  project_name: { type: String, trim: true },

  user_id: { type: String, required: true },
  user_name: { type: String, trim: true },
  user_email: { type: String, trim: true },
  user_avatar: { type: String },

  role: { type: String, enum: ["owner", "member", "viewer"], default: "member" },

  // Permissions
  can_add_expenses: { type: Boolean, default: true },
  can_edit_project: { type: Boolean, default: false },

  added_by_user_id: { type: String },
  added_by_user_name: { type: String, trim: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

Schema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index pour éviter les doublons et améliorer les performances
Schema.index({ project_id: 1, user_id: 1 }, { unique: true });
Schema.index({ user_id: 1 });

const OBJ = mongoose.model(MODELNAME, Schema);
module.exports = OBJ;
