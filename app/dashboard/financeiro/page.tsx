'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import { createClient } from '@/utils/supabase/client'

interface Transacao {
  id: string
  descricao: string
  cliente: string
  tipo: string
  valor: number
  data: string
  status: string
  origem?: string
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pago': return { bg: 'rgba(52,211,153,0.2)', text: '#34d399' }
    case 'Pendente': return { bg: 'rgba(251,191,36,0.2)', text: '#fbbf24' }
    case 'Atrasado': return { bg: 'rgba(239,68,68,0.2)', text: '#ef4444' }
    default: return { bg: 'rgba(148,163,184,0.2)', text: '#94a3b8' }
  }
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')

export default function Financeiro() {
  const [modalOpen, setModalOpen] = useState(false)
  const [periodFilter, setPeriodFilter] = useState('Este mês')
  const [transactions, setTransactions] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTransaction, setNewTransaction] = useState({ descricao: '', cliente: '', tipo: 'Despesa', valor: '', data: '', status: 'Pago', observacoes: '' })
  const supabase = createClient()

  useEffect(() => { loadTransactions() }, [])

  const loadTransactions = async () => {
    setLoading(true)

    // Carrega transações manuais
    const { data: transData } = await supabase.from('transacoes').select('*').order('data', { ascending: false })

    // Carrega pagamentos dos contratos (parcelas reais)
    const { data: pagamentosData } = await supabase
      .from('pagamentos')
      .select('*, contratos(cliente, tipo)')
      .order('data', { ascending: false })

    const manualTransactions: Transacao[] = transData || []

    // Converte pagamentos de contratos em transações
    const pagamentoTransactions: Transacao[] = (pagamentosData || []).map((p: any) => ({
      id: `pagamento-${p.id}`,
      descricao: p.descricao || `${p.tipo} - ${p.contratos?.cliente || ''}`,
      cliente: p.contratos?.cliente || '-',
      tipo: 'Receita',
      valor: p.valor,
      data: p.data,
      status: p.status,
      origem: 'pagamento',
    }))

    setTransactions([...pagamentoTransactions, ...manualTransactions])
    setLoading(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from('transacoes').insert([{
        descricao: newTransaction.descricao,
        cliente: newTransaction.cliente || '-',
        tipo: newTransaction.tipo,
        valor: parseFloat(newTransaction.valor),
        data: newTransaction.data,
        status: newTransaction.status,
        observacoes: newTransaction.observacoes,
        user_id: user.id,
      }]).select().single()

      if (!error && data) {
        setTransactions([{ ...data, origem: 'manual' }, ...transactions])
        setModalOpen(false)
        setNewTransaction({ descricao: '', cliente: '', tipo: 'Despesa', valor: '', data: '', status: 'Pago', observacoes: '' })
      }
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (id.startsWith('pagamento-')) return
    const { error } = await supabase.from('transacoes').delete().eq('id', id)
    if (!error) setTransactions(transactions.filter(t => t.id !== id))
  }

  // Filtra por período
  const now = new Date()
  const filtered = transactions.filter(t => {
    if (!t.data) return false
    const d = new Date(t.data + 'T00:00:00')
    if (periodFilter === 'Este mês') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    if (periodFilter === 'Último mês') {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return d.getMonth() === last.getMonth() && d.getFullYear() === last.getFullYear()
    }
    return d.getFullYear() === now.getFullYear()
  })

  // Calcula métricas
  const receita = filtered.filter(t => t.tipo === 'Receita' && t.status === 'Pago').reduce((s, t) => s + t.valor, 0)
  const despesa = filtered.filter(t => t.tipo === 'Despesa' && t.status === 'Pago').reduce((s, t) => s + t.valor, 0)
  const lucro = receita - despesa
  const inadimplencia = filtered.filter(t => t.tipo === 'Receita' && t.status === 'Atrasado').reduce((s, t) => s + t.valor, 0)
  const pendente = filtered.filter(t => t.tipo === 'Receita' && t.status === 'Pendente').reduce((s, t) => s + t.valor, 0)

  // Gráfico dos últimos 6 meses
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const monthTotal = transactions.filter(t => {
      if (!t.data) return false
      const td = new Date(t.data + 'T00:00:00')
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() && t.tipo === 'Receita' && t.status === 'Pago'
    }).reduce((s, t) => s + t.valor, 0)
    return { month: d.toLocaleDateString('pt-BR', { month: 'short' }), value: monthTotal }
  })
  const maxVal = Math.max(...monthlyData.map(r => r.value), 1)

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#f8f8ff' }}>Financeiro</h2>
            <p style={{ color: '#8b8b9e' }}>Gerencie suas finanças</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="px-6 py-2 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>
            + Nova Transação
          </button>
        </header>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {['Este mês', 'Último mês', 'Este ano'].map(f => (
            <button key={f} onClick={() => setPeriodFilter(f)} className="px-4 py-2 rounded-lg text-sm transition-all" style={{ backgroundColor: periodFilter === f ? '#7c6af7' : '#1e1e2e', color: '#f8f8ff' }}>{f}</button>
          ))}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Receita recebida', value: fmt(receita), color: '#34d399' },
            { label: 'Despesas', value: fmt(despesa), color: '#ef4444' },
            { label: 'Lucro líquido', value: fmt(lucro), color: lucro >= 0 ? '#7c6af7' : '#ef4444' },
            { label: 'A receber', value: fmt(pendente + inadimplencia), color: '#fbbf24' },
          ].map((s, i) => (
            <div key={i} className="p-6 rounded-xl border" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
              <p className="text-sm mb-2" style={{ color: '#8b8b9e' }}>{s.label}</p>
              <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Gráfico */}
        <div className="p-6 rounded-xl border mb-8" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
          <h3 className="text-xl font-bold mb-6" style={{ color: '#f8f8ff' }}>Receita dos últimos 6 meses</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {monthlyData.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs" style={{ color: '#8b8b9e' }}>{item.value > 0 ? fmt(item.value).replace('R$\u00a0', '') : ''}</span>
                <div className="w-full rounded-t-lg hover:opacity-80 transition-all"
                  style={{ backgroundColor: item.value > 0 ? '#7c6af7' : '#1e1e2e', height: `${Math.max((item.value / maxVal) * 100, 4)}%` }} />
                <span className="text-xs" style={{ color: '#8b8b9e' }}>{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center" style={{ color: '#8b8b9e' }}>Carregando transações...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-lg font-semibold mb-2" style={{ color: '#f8f8ff' }}>Nenhuma transação ainda</p>
                <p style={{ color: '#8b8b9e' }}>Pagamentos dos contratos aparecem automaticamente. Adicione despesas manualmente.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                    {['Descrição', 'Cliente', 'Tipo', 'Valor', 'Data', 'Status', 'Ações'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#f8f8ff' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const sc = getStatusColor(t.status)
                    const isRevenue = t.tipo === 'Receita'
                    const isPagamento = t.id.startsWith('pagamento-')
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #1e1e2e' }}>
                        <td className="px-6 py-4" style={{ color: '#f8f8ff' }}>
                          <div className="flex items-center gap-2">
                            {t.descricao}
                            {isPagamento && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(52,211,153,0.2)', color: '#34d399' }}>Contrato</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4" style={{ color: '#8b8b9e' }}>{t.cliente}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: isRevenue ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)', color: isRevenue ? '#34d399' : '#ef4444' }}>{t.tipo}</span>
                        </td>
                        <td className="px-6 py-4 font-semibold" style={{ color: isRevenue ? '#34d399' : '#ef4444' }}>{isRevenue ? '+' : '-'}{fmt(t.valor)}</td>
                        <td className="px-6 py-4" style={{ color: '#8b8b9e' }}>{fmtDate(t.data)}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: sc.bg, color: sc.text }}>{t.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          {!isPagamento && (
                            <button onClick={() => handleDelete(t.id)} className="px-3 py-1 rounded text-sm hover:opacity-80" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>Excluir</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-xl p-6" style={{ backgroundColor: '#13131a', maxHeight: '90vh', overflowY: 'auto', scrollbarWidth: 'none' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#f8f8ff' }}>Nova Transação</h3>
                <button onClick={() => setModalOpen(false)} className="text-2xl hover:opacity-80" style={{ color: '#8b8b9e' }}>×</button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                {[
                  { label: 'Descrição', key: 'descricao', type: 'text', placeholder: 'Ex: Aluguel estúdio, Lente 85mm...' },
                  { label: 'Cliente (opcional)', key: 'cliente', type: 'text', placeholder: 'Nome do cliente' },
                  { label: 'Valor (R$)', key: 'valor', type: 'number', placeholder: '0,00' },
                  { label: 'Data', key: 'data', type: 'date', placeholder: '' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>{f.label}</label>
                    <input type={f.type} required={f.key !== 'cliente'} placeholder={f.placeholder}
                      value={(newTransaction as Record<string, string>)[f.key]}
                      onChange={e => setNewTransaction({ ...newTransaction, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none"
                      style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Tipo</label>
                  <select value={newTransaction.tipo} onChange={e => setNewTransaction({ ...newTransaction, tipo: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                    <option>Despesa</option><option>Receita</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Status</label>
                  <select value={newTransaction.status} onChange={e => setNewTransaction({ ...newTransaction, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                    <option>Pago</option><option>Pendente</option><option>Atrasado</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-3 rounded-lg font-semibold hover:opacity-80" style={{ backgroundColor: '#1e1e2e', color: '#f8f8ff' }}>Cancelar</button>
                  <button type="submit" disabled={saving} className="flex-1 px-4 py-3 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Salvando...' : 'Salvar'}
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