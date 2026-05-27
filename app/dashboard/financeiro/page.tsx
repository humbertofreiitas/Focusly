'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function Financeiro() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [periodFilter, setPeriodFilter] = useState('Este mês')
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
    { name: 'Orçamentos', icon: '💰', active: false },
    { name: 'Contratos', icon: '📄', active: false },
    { name: 'Financeiro', icon: '💳', active: true },
    { name: 'Entregas', icon: '📦', active: false },
  ]

  const [transactions, setTransactions] = useState([
    { id: 1, descricao: 'Pagamento - Casamento Maria Silva', cliente: 'Maria Silva', tipo: 'Receita', valor: 4250, data: '2026-05-28', status: 'Pago' },
    { id: 2, descricao: 'Equipamento - Lente 85mm', cliente: '-', tipo: 'Despesa', valor: 3500, data: '2026-05-25', status: 'Pago' },
    { id: 3, descricao: 'Pagamento - Corporativo João Santos', cliente: 'João Santos', tipo: 'Receita', valor: 1600, data: '2026-05-24', status: 'Pendente' },
    { id: 4, descricao: 'Aluguel estúdio', cliente: '-', tipo: 'Despesa', valor: 1200, data: '2026-05-20', status: 'Pago' },
    { id: 5, descricao: 'Pagamento - Aniversário Ana Costa', cliente: 'Ana Costa', tipo: 'Receita', valor: 900, data: '2026-05-15', status: 'Atrasado' },
    { id: 6, descricao: 'Software - Adobe Lightroom', cliente: '-', tipo: 'Despesa', valor: 150, data: '2026-05-10', status: 'Pago' },
  ])

  const [newTransaction, setNewTransaction] = useState({
    descricao: '',
    cliente: '',
    tipo: 'Receita',
    valor: '',
    data: '',
    status: 'Pendente',
    observacoes: '',
  })

  const monthlyRevenue = [
    { month: 'Dez', value: 8500 },
    { month: 'Jan', value: 9200 },
    { month: 'Fev', value: 7800 },
    { month: 'Mar', value: 10500 },
    { month: 'Abr', value: 11200 },
    { month: 'Mai', value: 12500 },
  ]

  const maxValue = Math.max(...monthlyRevenue.map(r => r.value))

  const stats = [
    { label: 'Receita do mês', value: 'R$ 12.500', color: '#34d399' },
    { label: 'Despesas do mês', value: 'R$ 4.850', color: '#ef4444' },
    { label: 'Lucro líquido', value: 'R$ 7.650', color: '#7c6af7' },
    { label: 'Inadimplência', value: 'R$ 900', color: '#fbbf24' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago':
        return { bg: 'rgba(52, 211, 153, 0.2)', text: '#34d399' }
      case 'Pendente':
        return { bg: 'rgba(251, 191, 36, 0.2)', text: '#fbbf24' }
      case 'Atrasado':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' }
      default:
        return { bg: 'rgba(148, 163, 184, 0.2)', text: '#94a3b8' }
    }
  }

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault()
    const transaction = {
      id: transactions.length + 1,
      descricao: newTransaction.descricao,
      cliente: newTransaction.cliente || '-',
      tipo: newTransaction.tipo,
      valor: parseFloat(newTransaction.valor),
      data: newTransaction.data,
      status: newTransaction.status,
    }
    setTransactions([...transactions, transaction])
    setModalOpen(false)
    setNewTransaction({ descricao: '', cliente: '', tipo: 'Receita', valor: '', data: '', status: 'Pendente', observacoes: '' })
  }

  const handleDeleteTransaction = (id: number) => {
    setTransactions(transactions.filter(t => t.id !== id))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
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
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#f8f8ff' }}>
              Financeiro
            </h2>
            <p style={{ color: '#8b8b9e' }}>
              Gerencie suas finanças
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-6 py-2 rounded-lg font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}
          >
            Nova Transação
          </button>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border"
              style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}
            >
              <p className="text-sm mb-2" style={{ color: '#8b8b9e' }}>
                {stat.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div
          className="p-6 rounded-xl border mb-8"
          style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}
        >
          <h3 className="text-xl font-bold mb-6" style={{ color: '#f8f8ff' }}>
            Receita dos últimos 6 meses
          </h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {monthlyRevenue.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg transition-all hover:opacity-80"
                  style={{
                    backgroundColor: '#7c6af7',
                    height: `${(item.value / maxValue) * 100}%`,
                  }}
                />
                <span className="text-xs" style={{ color: '#8b8b9e' }}>
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2 mb-6">
          {['Este mês', 'Último mês', 'Este ano'].map((filter) => (
            <button
              key={filter}
              onClick={() => setPeriodFilter(filter)}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: periodFilter === filter ? '#7c6af7' : '#1e1e2e',
                color: '#f8f8ff',
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Transactions table */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#f8f8ff' }}>
                    Descrição
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold hidden md:table-cell" style={{ color: '#f8f8ff' }}>
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#f8f8ff' }}>
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#f8f8ff' }}>
                    Valor
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold hidden lg:table-cell" style={{ color: '#f8f8ff' }}>
                    Data
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#f8f8ff' }}>
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#f8f8ff' }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const statusColor = getStatusColor(transaction.status)
                  const isRevenue = transaction.tipo === 'Receita'
                  return (
                    <tr key={transaction.id} style={{ borderBottom: '1px solid #1e1e2e' }}>
                      <td className="px-6 py-4" style={{ color: '#f8f8ff' }}>
                        {transaction.descricao}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell" style={{ color: '#8b8b9e' }}>
                        {transaction.cliente}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: isRevenue ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: isRevenue ? '#34d399' : '#ef4444',
                          }}
                        >
                          {transaction.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold" style={{ color: isRevenue ? '#34d399' : '#ef4444' }}>
                        {isRevenue ? '+' : '-'}{formatCurrency(transaction.valor)}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell" style={{ color: '#8b8b9e' }}>
                        {formatDate(transaction.data)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="px-3 py-1 rounded text-sm transition-all hover:opacity-80"
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
                  Nova Transação
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-2xl hover:opacity-80"
                  style={{ color: '#8b8b9e' }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>
                    Descrição
                  </label>
                  <input
                    type="text"
                    required
                    value={newTransaction.descricao}
                    onChange={(e) => setNewTransaction({ ...newTransaction, descricao: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#0a0a0f',
                      borderColor: '#1e1e2e',
                      color: '#f8f8ff'
                    }}
                    placeholder="Descrição da transação"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>
                    Cliente (opcional)
                  </label>
                  <input
                    type="text"
                    value={newTransaction.cliente}
                    onChange={(e) => setNewTransaction({ ...newTransaction, cliente: e.target.value })}
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
                    Tipo
                  </label>
                  <select
                    required
                    value={newTransaction.tipo}
                    onChange={(e) => setNewTransaction({ ...newTransaction, tipo: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#0a0a0f',
                      borderColor: '#1e1e2e',
                      color: '#f8f8ff'
                    }}
                  >
                    <option value="Receita">Receita</option>
                    <option value="Despesa">Despesa</option>
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
                    value={newTransaction.valor}
                    onChange={(e) => setNewTransaction({ ...newTransaction, valor: e.target.value })}
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
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={newTransaction.data}
                    onChange={(e) => setNewTransaction({ ...newTransaction, data: e.target.value })}
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
                    Status
                  </label>
                  <select
                    required
                    value={newTransaction.status}
                    onChange={(e) => setNewTransaction({ ...newTransaction, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: '#0a0a0f',
                      borderColor: '#1e1e2e',
                      color: '#f8f8ff'
                    }}
                  >
                    <option value="Pago">Pago</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>
                    Observações
                  </label>
                  <textarea
                    value={newTransaction.observacoes}
                    onChange={(e) => setNewTransaction({ ...newTransaction, observacoes: e.target.value })}
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
