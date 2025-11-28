import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { AiOutlineSearch } from "react-icons/ai"
import { TbFilter, TbX } from "react-icons/tb"
import API from "@/services/api"
import useStore from "@/services/store"
import LoadingButton from "@/components/loadingButton"
import Modal from "@/components/modal"

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [allProjects, setAllProjects] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  // Filters state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [budgetFilter, setBudgetFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date")

  useEffect(() => {
    fetchProjects()
    fetchExpenses()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, statusFilter, budgetFilter, sortBy, allProjects, expenses])

  const fetchProjects = async () => {
    try {
      const { ok, data } = await API.post("/project/search", {})
      if (!ok) return toast.error("Erreur lors du chargement des projets")
      setAllProjects(data)
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }

  const fetchExpenses = async () => {
    try {
      const { ok, data } = await API.post("/expense/search", {})
      if (ok) setExpenses(data)
    } catch (error) {
      console.error(error)
    }
  }

  const calculateBudgetStatus = project => {
    const totalSpent = expenses.filter(e => e.project_id === project._id).reduce((sum, e) => sum + e.amount, 0)

    const percentage = project.budget > 0 ? (totalSpent / project.budget) * 100 : 0

    if (percentage >= 100) return { status: "over", color: "bg-red-500", text: "Dépassé", percentage, spent: totalSpent }
    if (percentage >= 80) return { status: "warning", color: "bg-yellow-500", text: "Attention", percentage, spent: totalSpent }
    return { status: "ok", color: "bg-green-500", text: "OK", percentage, spent: totalSpent }
  }

  const applyFilters = () => {
    let filtered = [...allProjects]

    // Search by name
    if (searchQuery) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Filter by project status
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Filter by budget status
    if (budgetFilter !== "all") {
      filtered = filtered.filter(p => {
        const budgetStatus = calculateBudgetStatus(p)
        return budgetStatus.status === budgetFilter
      })
    }

    // Sort
    if (sortBy === "date") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === "budget") {
      filtered.sort((a, b) => b.budget - a.budget)
    } else if (sortBy === "spent") {
      filtered.sort((a, b) => {
        const spentA = calculateBudgetStatus(a).spent
        const spentB = calculateBudgetStatus(b).spent
        return spentB - spentA
      })
    }

    setProjects(filtered)
  }

  const handleDelete = async id => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) return

    try {
      const { ok } = await API.delete(`/project/${id}`)
      if (!ok) return toast.error("Erreur lors de la suppression")
      toast.success("Projet supprimé")
      fetchProjects()
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setBudgetFilter("all")
    setSortBy("date")
  }

  const hasActiveFilters = searchQuery || statusFilter !== "all" || budgetFilter !== "all" || sortBy !== "date"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className={"text-gray-600"}>Chargement...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-gray-500">
            {projects.length} projet{projects.length > 1 ? "s" : ""} trouvé{projects.length > 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition">
          Nouveau Projet
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="rounded-lg border p-5 mb-6 bg-white border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TbFilter className="text-lg text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700">Filtres</h3>
          </div>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs font-medium flex items-center space-x-1 text-gray-600 hover:text-gray-800">
              <TbX className="text-sm" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Rechercher</label>
            <div className="relative">
              <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Nom du projet..."
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Statut du projet</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="completed">Complété</option>
              <option value="archived">Archivé</option>
            </select>
          </div>

          {/* Budget Status Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">État du budget</label>
            <select
              value={budgetFilter}
              onChange={e => setBudgetFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les budgets</option>
              <option value="ok">Dans le budget</option>
              <option value="warning">À risque</option>
              <option value="over">Dépassé</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Trier par</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Date (récent)</option>
              <option value="name">Nom (A-Z)</option>
              <option value="budget">Budget (élevé)</option>
              <option value="spent">Dépenses (élevé)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-3">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== "all" || budgetFilter !== "all" ? "Aucun projet ne correspond aux filtres" : "Aucun projet pour le moment"}
          </p>
          {!searchQuery && statusFilter === "all" && budgetFilter === "all" && (
            <button onClick={() => setShowModal(true)} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Créer votre premier projet
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const budgetInfo = calculateBudgetStatus(project)
            return (
              <div
                key={project._id}
                className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-6 cursor-pointer"
                onClick={() => navigate(`/project/${project._id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{project.name}</h3>
                  <span className={`${budgetInfo.color} text-white text-xs px-2.5 py-1 rounded-full font-medium`}>{budgetInfo.text}</span>
                </div>

                {project.description && <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>}

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Budget</span>
                    <span className="font-semibold text-gray-900">{project.budget.toLocaleString("fr-FR")} €</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span>Dépensé</span>
                    <span className="font-semibold text-orange-600">{budgetInfo.spent.toLocaleString("fr-FR")} €</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${budgetInfo.color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(budgetInfo.percentage, 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{budgetInfo.percentage.toFixed(0)}% utilisé</div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">{project.owner_name}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleDelete(project._id)
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-medium transition"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} onSuccess={fetchProjects} />}
    </div>
  )
}

function CreateProjectModal({ onClose, onSuccess }) {
  const [name, setName] = useState("")
  const [budget, setBudget] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()

    if (!name.trim()) return toast.error("Le nom est requis")
    if (!budget || budget <= 0) return toast.error("Le budget doit être supérieur à 0")

    setLoading(true)
    try {
      const { ok } = await API.post("/project", {
        name: name.trim(),
        budget: parseFloat(budget),
        description: description.trim()
      })

      if (!ok) return toast.error("Erreur lors de la création")

      toast.success("Projet créé avec succès")
      onSuccess()
      onClose()
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors de la création")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Nouveau Projet</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom du projet</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Refonte site web"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget (€)</label>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="10000"
              min="0"
              step="0.01"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description du projet..."
              rows="3"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Annuler
            </button>
            <LoadingButton loading={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm rounded-lg transition">
              Créer
            </LoadingButton>
          </div>
        </form>
      </div>
    </Modal>
  )
}
