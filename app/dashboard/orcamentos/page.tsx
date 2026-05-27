'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Quote {
  id: number
  numero: string
  cliente: string
  tipo: string
  valor: number
  dataEnvio: string
  validade: string
  status: string
}

export default function Orcamentos() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const menuItems = [
    { name: 'Dashboard', icon: '📊', active: false },
    { name: 'Clientes', icon: '👥', active: false },
    { name: 'Agenda', icon: '📅', active: false },
    { name: 'Orçamentos', icon: '💰', active: true },
    { name: 'Contratos', icon: '📄', active: false },
    { name: 'Financeiro', icon: '💳', active: false },
    { name: 'Entregas', icon: '📦', active: false },
  ]

  const [quotes, setQuotes] = useState<Quote[]>([
    { id: 1, numero: '001', cliente: 'Maria Silva', tipo: 'Casamento', valor: 8500, dataEnvio: '2026-05-20', validade: '2026-06-20', status: 'Aprovado' },
    { id: 2, numero: '002', cliente: 'João Santos', tipo: 'Corporativo', valor: 3200, dataEnvio: '2026-05-25', validade: '2026-06-25', status: 'Pendente' },
    { id: 3, numero: '003', cliente: 'Ana Costa', tipo: 'Aniversário', valor: 1800, dataEnvio: '2026-05-28', validade: '2026-06-28', status: 'Pendente' },
    { id: 4, numero: '004', cliente: 'Pedro Lima', tipo: 'Newborn', valor: 1200, dataEnvio: '2026-05-15', validade: '2026-06-15', status: 'Recusado' },
    { id: 5, numero: '005', cliente: 'Carla Oliveira', tipo: 'Ensaio', valor: 950, dataEnvio: '2026-05-10', validade: '2026-06-10', status: 'Expirado' },
  ])

  const [newQuote, setNewQuote] = useState({
    cliente: '',
    tipo: 'Casamento',
    dataSessao: '',
    pacote: 'Básico',
    valor: '',
    validade: '',
    descricao: '',
    observacoes: '',
  })

  const stats = [
    { label: 'Total enviados', value: quotes.length.toString(), color: '#7c6af7' },
    { label: 'Aguardando resposta', value: quotes.filter(q => q.status === 'Pendente').length.toString(), color: '#fbbf24' },
    { label: 'Aprovados', value: quotes.filter(q => q.status === 'Aprovado').length.toString(), color: '#34d399' },
    { label: 'Recusados', value: quotes.filter(q => q.status === 'Recusado').length.toString(), color: '#ef4444' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovado':
        return { bg: 'rgba(52, 211, 153, 0.2)', text: '#34d399' }
      case 'Pendente':
        return { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' }
      case 'Recusado':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' }
      case 'Expirado':
        return { bg: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8' }
      default:
        return { bg: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8' }
    }
  }

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault()
    const quote = {
      id: quotes.length + 1,
      numero: String(quotes.length + 1).padStart(3, '0'),
      cliente: newQuote.cliente,
      tipo: newQuote.tipo,
      valor: parseFloat(newQuote.valor),
      dataEnvio: new Date().toISOString().split('T')[0],
      validade: newQuote.validade,
      status: 'Pendente',
    }
    setQuotes([...quotes, quote])
    setModalOpen(false)
    setNewQuote({ cliente: '', tipo: 'Casamento', dataSessao: '', pacote: 'Básico', valor: '', validade: '', descricao: '', observacoes: '' })
  }

  const handleDuplicateQuote = (id: number) => {
    const quoteToDuplicate = quotes.find(q => q.id === id)
    if (quoteToDuplicate) {
      const duplicatedQuote = {
        ...quoteToDuplicate,
        id: quotes.length + 1,
        numero: String(quotes.length + 1).padStart(3, '0'),
        dataEnvio: new Date().toISOString().split('T')[0],
        status: 'Pendente',
      }
      setQuotes([...quotes, duplicatedQuote])
    }
  }

  const handleDeleteQuote = (id: number) => {
    setQuotes(quotes.filter(quote => quote.id !== id))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const getDaysRemaining = (validade: string) => {
    const today = new Date()
    const validity = new Date(validade)
    const diffTime = validity.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getInitialsColor = (name: string) => {
    const colors = ['#7c6af7', '#34d399', '#fbbf24', '#ef4444', '#3b82f6', '#a78bfa']
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{ backgroundColor: '#13131a', color: '#f8f8ff' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#13131a', borderRight: '1px solid #1e1e2e' }}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold" style={{ color: '#a78bfa' }}>
            Focusly
          </h1>
        </div>

        <nav className="px-4 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.name === 'Dashboard' ? '/dashboard' : `/dashboard/${item.name.toLowerCase()}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                item.active ? 'font-semibold' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: item.active ? '#7c6af7' : 'transparent',
                color: '#f8f8ff',
              }}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </a>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all hover:opacity-80"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
          >
            <span className="text-xl">🚪</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold" style={{ color: '#f8f8ff' }}>
              Orçamentos
            </h2>
            <p style={{ color: '#8b8b9e' }}>
              Gerencie seus orçamentos
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Buscar orçamentos..."
              className="px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: '#13131a',
                borderColor: '#1e1e2e',
                color: '#f8f8ff'
              }}
            />
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-2 rounded-lg font-semibold transition-all hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}
            >
              Novo Orçamento
            </button>
          </div>
        </header>

        {/* Stats Cards - Horizontal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border flex items-center justify-between"
              style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}
            >
              <div>
                <p className="text-sm mb-1" style={{ color: '#8b8b9e' }}>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
              >
                {index === 0 ? '📊' : index === 1 ? '⏳' : index === 2 ? '✓' : '✗'}
              </div>
            </div>
          ))}
        </div>

        {/* Premium Invoice List */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}
        >
          {quotes.map((quote, index) => {
            const statusColor = getStatusColor(quote.status)
            const initials = quote.cliente.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            const daysRemaining = getDaysRemaining(quote.validade)
            const avatarColor = getInitialsColor(quote.cliente)
            return (
              <div
                key={quote.id}
                className="p-6 transition-all hover:bg-opacity-80"
                style={{
                  borderBottom: index < quotes.length - 1 ? '1px solid #1e1e2e' : 'none',
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Left: Avatar + Client Info */}
                  <div className="flex items-center gap-4 lg:w-64">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
                      style={{ backgroundColor: avatarColor, color: '#f8f8ff' }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg truncate" style={{ color: '#f8f8ff' }}>
                        {quote.cliente}
                      </h3>
                      <p className="text-sm" style={{ color: '#8b8b9e' }}>
                        {quote.tipo}
                      </p>
                    </div>
                  </div>

                  {/* Center Left: Number + Date */}
                  <div className="flex flex-col gap-1 lg:w-32">
                    <span className="font-semibold" style={{ color: '#a78bfa' }}>
                      #{quote.numero}
                    </span>
                    <span className="text-sm" style={{ color: '#8b8b9e' }}>
                      {formatDate(quote.dataEnvio)}
                </span>
                  </div>

                  {/* Center: Value */}
                  <div className="lg:flex-1">
                    <p className="text-3xl font-bold" style={{ color: '#f8f8ff' }}>
                      {formatCurrency(quote.valor)}
                    </p>
                  </div>

                  {/* Center Right: Validity Bar */}
                  <div className="lg:w-48">
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: '#8b8b9e' }}>Validade</span>
                  <span style={{ color: daysRemaining > 0 ? '#34d399' : '#ef4444' }}>
                    {daysRemaining > 0 ? `${daysRemaining} dias` : 'Expirado'}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#1e1e2e' }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: daysRemaining > 0 ? '#34d399' : '#ef4444',
                      width: `${Math.min(Math.max(daysRemaining / 30 * 100, 0), 100)}%`,
                    }}
                  />
                </div>
              </div>

                  {/* Right: Status + Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:w-auto">
                    <span
                      className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap"
                      style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                    >
                      {quote.status}
                    </span>
                    <div className="flex gap-2">
                      <button
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}
                        title="Ver"
                      >
                        👁
                      </button>
                      <button
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ backgroundColor: '#a78bfa', color: '#f8f8ff' }}
                        title="Editar"
                      >
                        ✏
                      </button>
                      <button
                        onClick={() => handleDuplicateQuote(quote.id)}
                        className="p-2 rounded-lg transition-all hover:opacity-80"
                        style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}
                        title="Duplicar"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div
              className="w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#f8f8ff' }}>
                  Novo Orçamento
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-2xl hover:opacity-80"
                  style={{ color: '#8b8b9e' }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddQuote} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>
                    Cliente
                  </label>
                  <input
                    type="text"
                    required
                    value={newQuote.cliente}
                    onChange={(e) => setNewQuote({ ...newQuote, cliente: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#0a0a0f',
                      borderColor: '#1e1e2e',
                      color: '#f8f8ff'
                    }}
                    placeholder="Nome do cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>
                    Tipo de sessão
                  </label>
                  <select
                    required
                    value={newQuote.tipo}
                    onChange={(e) => setNewQuote({ ...newQuote, tipo: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#0a0a0f',
                      borderColor: '#1e1e2e',
                      color: '#f8f8ff'
                    }}
                  >
                    <option value="Casamento">Casamento</option>
                    <option value="Ensaio">Ensaio</option>
                    <option value="Newborn">Newborn</option>
                    <option value="Aniversário">Aniversário</option>
                    <option value="Corporativo">Corporativo</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>
                    Data da sessão
                  </label>
                  <input
                    type="date"
                    value={newQuote.dataSessao}
                    onChange={(e) => setNewQuote({ ...newQuote, dataSessao: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#0a0a0f',
                      borderColor: '#1e1e2e',
                      color: '#f8f8ff'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>
                    Pacote
                  </label>
                  <select
                    value={newQuote.pacote}
                    onChange={(e) => setNewQuote({ ...newQuote, pacote: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#0a0a0f',
                      borderColor: '#1e1e2e',
                      color: '#f8f8ff'
                    }}
                  >
                    <option value="Básico">Básico</option>
                    <option value="Padrão">Padrão</option>
                    <option value="Premium">Premium</option>
                    <option value="Personalizado">Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={newQuote.valor}
                    onChange={(e) => setNewQuote({ ...newQuote, valor: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#0a0a0f',
                      borderColor: '#1e1e2e',
                      color: '#f8f8ff'
                    }}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>
                    Validade
                  </label>
                  <input
                    type="date"
                    required
                    value={newQuote.validade}
                    onChange={(e) => setNewQuote({ ...newQuote, validade: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#0a0a0f',
                      borderColor: '#1e1e2e',
                      color: '#f8f8ff'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>
                    Descrição dos serviços
                  </label>
                  <textarea
                    value={newQuote.descricao}
                    onChange={(e) => setNewQuote({ ...newQuote, descricao: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all resize-none"
                    style={{
                      backgroundColor: '#0a0a0f',
                      borderColor: '#1e1e2e',
                      color: '#f8f8ff'
                    }}
                    rows={4}
                    placeholder="Descreva os serviços incluídos..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>
                    Observações
                  </label>
                  <textarea
                    value={newQuote.observacoes}
                    onChange={(e) => setNewQuote({ ...newQuote, observacoes: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all resize-none"
                    style={{
                      backgroundColor: '#0a0a0f',
                      borderColor: '#1e1e2e',
                      color: '#f8f8ff'
                    }}
                    rows={3}
                    placeholder="Observações adicionais..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all hover:opacity-80"
                    style={{ backgroundColor: '#1e1e2e', color: '#f8f8ff' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all hover:opacity-90"
                    style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
