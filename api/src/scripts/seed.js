require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const process = require("process");

// Import models
const UserObject = require("../models/user");
const ProjectObject = require("../models/project");
const ExpenseObject = require("../models/expense");

const { MONGODB_ENDPOINT } = require("../config");

async function seed() {
  try {
    console.log("🌱 Connexion à MongoDB...");
    await mongoose.connect(MONGODB_ENDPOINT);
    console.log("✅ Connecté à MongoDB");

    // Clean existing data
    console.log("🗑️  Nettoyage des données existantes...");
    await ExpenseObject.deleteMany({});
    await ProjectObject.deleteMany({});
    await UserObject.deleteMany({});

    // Create test user
    console.log("👤 Création de l'utilisateur de test...");
    const password = await bcrypt.hash("password123", 10);
    const user = await UserObject.create({
      name: "Hugo Martin",
      email: "hugo@selego.co",
      password,
      role: "admin",
    });
    console.log(`✅ Utilisateur créé: ${user.email}`);

    // Create projects
    console.log("📁 Création des projets...");
    const projects = [
      {
        name: "Refonte Site Web",
        budget: 50000,
        description: "Modernisation complète du site corporate avec nouveau design et optimisation SEO",
        status: "active",
        owner_id: user._id.toString(),
        owner_name: user.name,
        owner_email: user.email,
      },
      {
        name: "Application Mobile iOS",
        budget: 80000,
        description: "Développement d'une application mobile native pour iOS avec React Native",
        status: "active",
        owner_id: user._id.toString(),
        owner_name: user.name,
        owner_email: user.email,
      },
      {
        name: "Campagne Marketing Q1",
        budget: 30000,
        description: "Campagne marketing digital pour le premier trimestre 2024",
        status: "active",
        owner_id: user._id.toString(),
        owner_name: user.name,
        owner_email: user.email,
      },
      {
        name: "Migration Infrastructure Cloud",
        budget: 45000,
        description: "Migration de l'infrastructure on-premise vers AWS",
        status: "active",
        owner_id: user._id.toString(),
        owner_name: user.name,
        owner_email: user.email,
      },
      {
        name: "Formation Équipe Dev",
        budget: 15000,
        description: "Programme de formation continue pour l'équipe de développement",
        status: "completed",
        owner_id: user._id.toString(),
        owner_name: user.name,
        owner_email: user.email,
      },
      {
        name: "Refonte Identité Visuelle",
        budget: 25000,
        description: "Création nouvelle identité de marque et charte graphique",
        status: "archived",
        owner_id: user._id.toString(),
        owner_name: user.name,
        owner_email: user.email,
      },
    ];

    const createdProjects = await ProjectObject.insertMany(projects);
    console.log(`✅ ${createdProjects.length} projets créés`);

    // Create expenses
    console.log("💰 Création des dépenses...");
    const expenses = [
      // Refonte Site Web (50000€ budget - 42000€ dépensé - 84% - Warning)
      {
        project_id: createdProjects[0]._id.toString(),
        project_name: createdProjects[0].name,
        amount: 15000,
        description: "Campagne Google Ads pour le lancement",
        category: "Marketing",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-01-15"),
      },
      {
        project_id: createdProjects[0]._id.toString(),
        project_name: createdProjects[0].name,
        amount: 18000,
        description: "Développement frontend React et intégration API",
        category: "Développement",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-01-20"),
      },
      {
        project_id: createdProjects[0]._id.toString(),
        project_name: createdProjects[0].name,
        amount: 9000,
        description: "Design UI/UX Figma et prototypage",
        category: "Design",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-01-10"),
      },

      // Application Mobile iOS (80000€ budget - 95000€ dépensé - 119% - Over)
      {
        project_id: createdProjects[1]._id.toString(),
        project_name: createdProjects[1].name,
        amount: 45000,
        description: "Développement application React Native iOS et Android",
        category: "Développement",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-02-01"),
      },
      {
        project_id: createdProjects[1]._id.toString(),
        project_name: createdProjects[1].name,
        amount: 12000,
        description: "Design interface mobile et animations",
        category: "Design",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-01-25"),
      },
      {
        project_id: createdProjects[1]._id.toString(),
        project_name: createdProjects[1].name,
        amount: 8000,
        description: "Hébergement AWS et configuration CI/CD",
        category: "Infrastructure",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-02-10"),
      },
      {
        project_id: createdProjects[1]._id.toString(),
        project_name: createdProjects[1].name,
        amount: 15000,
        description: "Campagne Instagram et TikTok pour le lancement",
        category: "Marketing",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-02-15"),
      },
      {
        project_id: createdProjects[1]._id.toString(),
        project_name: createdProjects[1].name,
        amount: 15000,
        description: "Tests utilisateurs et corrections bugs",
        category: "Développement",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-02-20"),
      },

      // Campagne Marketing Q1 (30000€ budget - 12000€ dépensé - 40% - OK)
      {
        project_id: createdProjects[2]._id.toString(),
        project_name: createdProjects[2].name,
        amount: 5000,
        description: "Publicité Facebook Ads janvier",
        category: "Marketing",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-01-05"),
      },
      {
        project_id: createdProjects[2]._id.toString(),
        project_name: createdProjects[2].name,
        amount: 4000,
        description: "Création de contenu SEO et articles blog",
        category: "Marketing",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-01-12"),
      },
      {
        project_id: createdProjects[2]._id.toString(),
        project_name: createdProjects[2].name,
        amount: 3000,
        description: "Design graphiques réseaux sociaux",
        category: "Design",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-01-08"),
      },

      // Migration Infrastructure Cloud (45000€ budget - 38000€ dépensé - 84% - Warning)
      {
        project_id: createdProjects[3]._id.toString(),
        project_name: createdProjects[3].name,
        amount: 18000,
        description: "Abonnement AWS pour infrastructure cloud",
        category: "Infrastructure",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-02-01"),
      },
      {
        project_id: createdProjects[3]._id.toString(),
        project_name: createdProjects[3].name,
        amount: 12000,
        description: "Développement scripts migration et automatisation",
        category: "Développement",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-02-05"),
      },
      {
        project_id: createdProjects[3]._id.toString(),
        project_name: createdProjects[3].name,
        amount: 8000,
        description: "Configuration sécurité et backup automatique",
        category: "Infrastructure",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-02-12"),
      },

      // Formation Équipe Dev (15000€ budget - 14500€ dépensé - 97% - Warning)
      {
        project_id: createdProjects[4]._id.toString(),
        project_name: createdProjects[4].name,
        amount: 8000,
        description: "Formation React avancé et TypeScript",
        category: "RH",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-01-10"),
      },
      {
        project_id: createdProjects[4]._id.toString(),
        project_name: createdProjects[4].name,
        amount: 4500,
        description: "Certification AWS Solutions Architect",
        category: "RH",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-01-20"),
      },
      {
        project_id: createdProjects[4]._id.toString(),
        project_name: createdProjects[4].name,
        amount: 2000,
        description: "Livres et ressources formation continue",
        category: "RH",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2024-01-25"),
      },

      // Refonte Identité Visuelle (25000€ budget - 24000€ dépensé - 96% - Warning)
      {
        project_id: createdProjects[5]._id.toString(),
        project_name: createdProjects[5].name,
        amount: 12000,
        description: "Création logo et charte graphique complète",
        category: "Design",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2023-12-01"),
      },
      {
        project_id: createdProjects[5]._id.toString(),
        project_name: createdProjects[5].name,
        amount: 8000,
        description: "Design supports communication print et digital",
        category: "Design",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2023-12-15"),
      },
      {
        project_id: createdProjects[5]._id.toString(),
        project_name: createdProjects[5].name,
        amount: 4000,
        description: "Photoshop et Illustrator pour assets visuels",
        category: "Design",
        created_by_user_id: user._id.toString(),
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        createdAt: new Date("2023-12-20"),
      },
    ];

    const createdExpenses = await ExpenseObject.insertMany(expenses);
    console.log(`✅ ${createdExpenses.length} dépenses créées`);

    // Summary
    console.log("\n📊 Résumé des données créées:");
    console.log("================================");
    console.log(`👤 Utilisateurs: 1`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Mot de passe: password123`);
    console.log(`\n📁 Projets: ${createdProjects.length}`);
    console.log(`   - Actifs: ${createdProjects.filter((p) => p.status === "active").length}`);
    console.log(`   - Complétés: ${createdProjects.filter((p) => p.status === "completed").length}`);
    console.log(`   - Archivés: ${createdProjects.filter((p) => p.status === "archived").length}`);
    console.log(`\n💰 Dépenses: ${createdExpenses.length}`);

    // Calculate stats
    const totalBudget = createdProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = createdExpenses.reduce((sum, e) => sum + e.amount, 0);
    console.log(`\n💵 Budget total: ${totalBudget.toLocaleString("fr-FR")} €`);
    console.log(`💸 Dépensé total: ${totalSpent.toLocaleString("fr-FR")} €`);
    console.log(`📈 Utilisation: ${((totalSpent / totalBudget) * 100).toFixed(1)}%`);

    console.log("\n✅ Seed terminé avec succès!");
    console.log("\n🚀 Vous pouvez maintenant vous connecter avec:");
    console.log(`   Email: hugo@selego.co`);
    console.log(`   Mot de passe: password123`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    process.exit(1);
  }
}

seed();
