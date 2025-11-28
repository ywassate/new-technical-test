const mongoose = require("mongoose");

const MODELNAME = "expense";

const Schema = new mongoose.Schema({
  // Flat data structure - store project info directly
  project_id: { type: String, required: true },
  project_name: { type: String, trim: true },

  amount: { type: Number, required: true, default: 0 },
  category: { type: String, trim: true },
  description: { type: String, trim: true },

  // Flat data structure - store user info directly
  created_by_user_id: { type: String, required: true },
  created_by_user_name: { type: String, trim: true },
  created_by_user_email: { type: String, trim: true },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

Schema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index pour améliorer les performances
Schema.index({ project_id: 1, createdAt: -1 }); // Recherche par projet + tri
Schema.index({ created_by_user_id: 1 }); // Recherche par utilisateur
Schema.index({ category: 1 }); // Filtrage par catégorie

const OBJ = mongoose.model(MODELNAME, Schema);
module.exports = OBJ;
