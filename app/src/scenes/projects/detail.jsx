import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import API from "@/services/api"
import LoadingButton from "@/components/loadingButton"
import Modal from "@/components/modal"

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchProject()
    fetchExpenses()
  }, [id])

  const fetchProject = async () => {
    try {
      const { ok, data } = await API.get(`/project/${id}`)
      if (!ok) {
        toast.error("Projet introuvable")
        return navigate("/projects")
      }
      setProject(data)
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenses = async () => {
    try {
      const { ok, data } = await API.post("/expense/search", { project_id: id })
      if (!ok) return toast.error("Erreur lors du chargement des dépenses")
      setExpenses(data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteExpense = async expenseId => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) return

    try {
      const { ok } = await API.delete(`/expense/${expenseId}`)
      if (!ok) return toast.error("Erreur lors de la suppression")
      toast.success("Dépense supprimée")
      fetchExpenses()
    } catch (error) {
      console.error(error)
      toast.error("Erreur")
    }
  }

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Chargement...</div>
      </div>
    )
  }

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const remaining = project.budget - totalSpent
  const percentage = project.budget > 0 ? (totalSpent / project.budget) * 100 : 0

  let statusColor = "bg-green-500"
  let statusText = "Dans le budget"
  if (percentage >= 100) {
    statusColor = "bg-red-500"
    statusText = "Budget dépassé"
  } else if (percentage >= 80) {
    statusColor = "bg-yellow-500"
    statusText = "Attention au budget"
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate("/projects")} className="text-blue-600 hover:text-blue-700 mb-4 flex items-center">
          ← Retour aux projets
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{project.name}</h1>
            {project.description && <p className="text-gray-600">{project.description}</p>}
          </div>
          <span className={`${statusColor} text-white px-4 py-2 rounded-lg font-medium`}>{statusText}</span>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Vue d'ensemble du budget</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Budget total</div>
            <div className="text-2xl font-bold text-blue-600">{project.budget.toLocaleString("fr-FR")} €</div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Dépensé</div>
            <div className="text-2xl font-bold text-orange-600">{totalSpent.toLocaleString("fr-FR")} €</div>
          </div>

          <div className={`${remaining >= 0 ? "bg-green-50" : "bg-red-50"} p-4 rounded-lg`}>
            <div className="text-sm text-gray-600 mb-1">Restant</div>
            <div className={`text-2xl font-bold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>{remaining.toLocaleString("fr-FR")} €</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className={`${statusColor} h-4 rounded-full transition-all`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
        </div>
        <div className="text-sm text-gray-600 mt-2">{percentage.toFixed(1)}% du budget utilisé</div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Dépenses ({expenses.length})</h2>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
            Ajouter une dépense
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">Aucune dépense pour ce projet</p>
            <button onClick={() => setShowModal(true)} className="text-blue-600 hover:text-blue-700 font-medium">
              Ajouter la première dépense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Catégorie</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Montant</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Créé par</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenses.map(expense => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{expense.description || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      {expense.category ? (
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">{expense.category}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{expense.amount.toLocaleString("fr-FR")} €</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{expense.created_by_user_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(expense.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => handleDeleteExpense(expense._id)} className="text-red-500 hover:text-red-700 font-medium">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <AddExpenseModal projectId={id} projectName={project.name} onClose={() => setShowModal(false)} onSuccess={fetchExpenses} />}
    </div>
  )
}

function AddExpenseModal({ projectId, projectName, onClose, onSuccess }) {
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const categories = ["Marketing", "Développement", "Design", "Infrastructure", "RH", "Autre"]

  const handleSubmit = async e => {
    e.preventDefault()

    if (!amount || amount <= 0) return toast.error("Le montant doit être supérieur à 0")

    setLoading(true)
    try {
      const { ok } = await API.post("/expense", {
        project_id: projectId,
        amount: parseFloat(amount),
        category: category || undefined,
        description: description.trim() || undefined
      })

      if (!ok) return toast.error("Erreur lors de la création")

      toast.success("Dépense ajoutée")
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("Erreur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">Nouvelle Dépense</h2>
        <p className="text-gray-600 mb-6">Projet: {projectName}</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Montant (€) *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1500"
              min="0"
              step="0.01"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Catégorie</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Campagne Facebook Ads Q1"
              rows="3"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Annuler
            </button>
            <LoadingButton loading={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">
              Ajouter
            </LoadingButton>
          </div>
        </form>
      </div>
    </Modal>
  )
}
