const mongoose = require("mongoose");

const MODELNAME = "project";

const Schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  budget: { type: Number, required: true, default: 0 },

  // Flat data structure - store user info directly
  owner_id: { type: String, required: true },
  owner_name: { type: String, trim: true },
  owner_email: { type: String, trim: true },

  description: { type: String, trim: true },
  status: { type: String, enum: ["active", "completed", "archived"], default: "active" },

  // Notification tracking
  budget_warning_sent: { type: Boolean, default: false }, // 80% warning sent
  budget_exceeded_sent: { type: Boolean, default: false }, // 100% alert sent

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

Schema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index pour améliorer les performances des recherches
Schema.index({ owner_id: 1, status: 1 }); // Recherche par owner et status
Schema.index({ createdAt: -1 }); // Tri par date
Schema.index({ name: "text" }); // Recherche full-text sur le nom

const OBJ = mongoose.model(MODELNAME, Schema);
module.exports = OBJ;
