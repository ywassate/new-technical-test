import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TbChartBar, TbFolder, TbAlertCircle, TbCircleCheck } from "react-icons/tb";
import API from "@/services/api";
import useStore from "@/services/store";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { ok: okProjects, data: projects } = await API.post("/project/search", {});
      if (!okProjects) return toast.error("Erreur chargement projets");

      const { ok: okExpenses, data: expenses } = await API.post("/expense/search", {});
      if (!okExpenses) return toast.error("Erreur chargement dépenses");

      const totalProjects = projects.length;
      const activeProjects = projects.filter((p) => p.status === "active").length;
      const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
      const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

      const projectsByStatus = projects.map((p) => {
        const projectExpenses = expenses.filter((e) => e.project_id === p._id);
        const spent = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
        const percentage = p.budget > 0 ? (spent / p.budget) * 100 : 0;

        let status = "OK";
        if (percentage >= 100) status = "Dépassé";
        else if (percentage >= 80) status = "À risque";

        return {
          name: p.name,
          budget: p.budget,
          spent: spent,
          remaining: Math.max(0, p.budget - spent),
          status: status,
          percentage: percentage,
          _id: p._id,
        };
      });

      const overBudget = projectsByStatus.filter((p) => p.status === "Dépassé").length;
      const atRisk = projectsByStatus.filter((p) => p.status === "À risque").length;
      const onTrack = projectsByStatus.filter((p) => p.status === "OK").length;

      const statusPieData = [
        { name: "OK", value: onTrack, color: "#10B981" },
        { name: "À risque", value: atRisk, color: "#F59E0B" },
        { name: "Dépassé", value: overBudget, color: "#EF4444" },
      ].filter((item) => item.value > 0);

      const categoryBreakdown = {};
      expenses.forEach((expense) => {
        const cat = expense.category || "Non catégorisé";
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + expense.amount;
      });

      const categoryChartData = Object.entries(categoryBreakdown)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const topProjectsData = projectsByStatus
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5)
        .map((p) => ({
          name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
          Dépensé: p.spent,
          Budget: p.budget,
        }));

      const budgetOverview = {
        total: totalBudget,
        spent: totalSpent,
        remaining: Math.max(0, totalBudget - totalSpent),
        percentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      };

      setStats({
        totalProjects,
        activeProjects,
        totalBudget,
        totalSpent,
        overBudget,
        atRisk,
        onTrack,
        statusPieData,
        categoryChartData,
        topProjectsData,
        budgetOverview,
        projects: projectsByStatus,
        recentExpenses: expenses.slice(0, 5),
      });
    } catch (error) {
      console.error(error);
      toast.error("Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-600">Bienvenue, {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Projets Totaux" value={stats.totalProjects} icon={<TbFolder className="w-6 h-6" />} gradient="from-blue-500 to-blue-600" />
        <StatCard title="Projets OK" value={stats.onTrack} icon={<TbCircleCheck className="w-6 h-6" />} gradient="from-green-500 to-green-600" />
        <StatCard title="À Risque" value={stats.atRisk} icon={<TbAlertCircle className="w-6 h-6" />} gradient="from-yellow-500 to-yellow-600" />
        <StatCard title="Dépassés" value={stats.overBudget} icon={<TbAlertCircle className="w-6 h-6" />} gradient="from-red-500 to-red-600" />
      </div>

      {/* Main Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Budget Gauge */}
        <div className="lg:col-span-1 rounded-lg border p-6 bg-white border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Budget Global</h2>
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle cx="96" cy="96" r="80" stroke="#e5e7eb" strokeWidth="16" fill="transparent" />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke={stats.budgetOverview.percentage >= 100 ? "#EF4444" : stats.budgetOverview.percentage >= 80 ? "#F59E0B" : "#10B981"}
                  strokeWidth="16"
                  fill="transparent"
                  strokeDasharray={`${(stats.budgetOverview.percentage / 100) * 502.65} 502.65`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-800">{Math.round(stats.budgetOverview.percentage)}%</span>
                <span className="text-xs text-gray-500">Utilisé</span>
              </div>
            </div>
            <div className="mt-6 w-full space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Budget</span>
                <span className="font-semibold text-blue-500">{stats.totalBudget.toLocaleString("fr-FR")} €</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Dépensé</span>
                <span className="font-semibold text-orange-500">{stats.totalSpent.toLocaleString("fr-FR")} €</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Restant</span>
                <span className={`font-semibold ${stats.budgetOverview.remaining >= 0 ? "text-green-500" : "text-red-500"}`}>{stats.budgetOverview.remaining.toLocaleString("fr-FR")} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution Pie */}
        <div className="lg:col-span-2 rounded-lg border p-6 bg-white border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Répartition des Projets</h2>
          {stats.statusPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stats.statusPieData} cx="50%" cy="50%" labelLine={false} label={renderCustomLabel} outerRadius={100} fill="#8884d8" dataKey="value">
                  {stats.statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} formatter={(value) => `${value} projet${value > 1 ? "s" : ""}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-gray-500">Aucun projet</div>
          )}
        </div>
      </div>

      {/* Main Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Breakdown */}
        <div className="rounded-lg border p-6 bg-white border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Dépenses par Catégorie</h2>
          {stats.categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} formatter={(value) => `${value.toLocaleString("fr-FR")} €`} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]}>
                  {stats.categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-gray-500">Aucune dépense</div>
          )}
        </div>

        {/* Top Projects */}
        <div className="rounded-lg border p-6 bg-white border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Top 5 Projets par Dépenses</h2>
          {stats.topProjectsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topProjectsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: "#6B7280" }} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }} formatter={(value) => `${value.toLocaleString("fr-FR")} €`} />
                <Legend />
                <Bar dataKey="Dépensé" fill="#EF4444" radius={[0, 8, 8, 0]} />
                <Bar dataKey="Budget" fill="#3B82F6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-gray-500">Aucun projet</div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="rounded-lg border p-6 bg-white border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Projets Récents</h2>
            <button onClick={() => navigate("/projects")} className="text-blue-500 hover:text-blue-600 text-xs font-medium">
              Voir tous →
            </button>
          </div>
          {stats.projects.length > 0 ? (
            <div className="space-y-3">
              {stats.projects.slice(0, 5).map((project) => (
                <div
                  key={project._id}
                  className="flex items-center justify-between p-3 rounded-lg transition cursor-pointer bg-gray-50 hover:bg-gray-100"
                  onClick={() => navigate(`/project/${project._id}`)}>
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-800">{project.name}</div>
                    <div className="text-xs text-gray-500">
                      {project.spent.toLocaleString("fr-FR")} € / {project.budget.toLocaleString("fr-FR")} €
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        project.status === "OK" ? "bg-green-100 text-green-700" : project.status === "À risque" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                      }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm mb-4 text-gray-500">Aucun projet</p>
              <button onClick={() => navigate("/projects")} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm rounded-lg transition font-medium">
                Créer un projet
              </button>
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="rounded-lg border p-6 bg-white border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Dernières Dépenses</h2>
          {stats.recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {stats.recentExpenses.map((expense) => (
                <div key={expense._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-800">{expense.description || "Sans description"}</div>
                    <div className="text-xs text-gray-500">
                      {expense.project_name} • {new Date(expense.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-gray-800">{expense.amount.toLocaleString("fr-FR")} €</div>
                    {expense.category && <div className="text-xs text-purple-500 font-medium mt-1">{expense.category}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-gray-500">Aucune dépense</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, gradient }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-lg border border-gray-200 shadow-sm p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-opacity-90 text-xs mb-1 font-medium">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
    </div>
  );
}

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="font-semibold text-xs">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}
