'use client'

import { useState } from 'react'
import Sidebar from '@/app/components/Sidebar'

interface Quote {
  id: number; numero: string; cliente: string; tipo: string; valor: number; dataEnvio: string; validade: string; status: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Aprovado': return { bg: 'rgba(52,211,153,0.2)', text: '#34d399' }
    case 'Pendente': return { bg: 'rgba(251,191,36,0.2)', text: '#fbbf24' }
    case 'Recusado': return { bg: 'rgba(239,68,68,0.2)', text: '#ef4444' }
    default: return { bg: 'rgba(148,163,184,0.2)', text: '#94a3b8' }
  }
}

const getAvatarColor = (name: string) => {
  const colors = ['#7c6af7', '#34d399', '#fbbf24', '#ef4444', '#3b82f6', '#a78bfa']
  return colors[name.charCodeAt(0) % colors.length]
}

export default function Orcamentos() {
  const [modalOpen, setModalOpen] = useState(false)
  const [quotes, setQuotes] = useState<Quote[]>([
    { id: 1, numero: '001', cliente: 'Maria Silva', tipo: 'Casamento', valor: 8500, dataEnvio: '2026-05-20', validade: '2026-06-20', status: 'Aprovado' },
    { id: 2, numero: '002', cliente: 'João Santos', tipo: 'Corporativo', valor: 3200, dataEnvio: '2026-05-25', validade: '2026-06-25', status: 'Pendente' },
    { id: 3, numero: '003', cliente: 'Ana Costa', tipo: 'Aniversário', valor: 1800, dataEnvio: '2026-05-28', validade: '2026-06-28', status: 'Pendente' },
    { id: 4, numero: '004', cliente: 'Pedro Lima', tipo: 'Newborn', valor: 1200, dataEnvio: '2026-05-15', validade: '2026-06-15', status: 'Recusado' },
    { id: 5, numero: '005', cliente: 'Carla Oliveira', tipo: 'Ensaio', valor: 950, dataEnvio: '2026-05-10', validade: '2026-06-10', status: 'Expirado' },
  ])
  const [newQuote, setNewQuote] = useState({ cliente: '', tipo: 'Casamento', dataSessao: '', pacote: 'Básico', valor: '', validade: '', descricao: '', observacoes: '' })

  const stats = [
    { label: 'Total enviados', value: quotes.length, color: '#7c6af7', icon: '📊' },
    { label: 'Aguardando', value: quotes.filter(q => q.status === 'Pendente').length, color: '#fbbf24', icon: '⏳' },
    { label: 'Aprovados', value: quotes.filter(q => q.status === 'Aprovado').length, color: '#34d399', icon: '✅' },
    { label: 'Recusados', value: quotes.filter(q => q.status === 'Recusado').length, color: '#ef4444', icon: '❌' },
  ]

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const n = quotes.length + 1
    setQuotes([...quotes, { id: n, numero: String(n).padStart(3, '0'), cliente: newQuote.cliente, tipo: newQuote.tipo, valor: parseFloat(newQuote.valor), dataEnvio: new Date().toISOString().split('T')[0], validade: newQuote.validade, status: 'Pendente' }])
    setModalOpen(false)
    setNewQuote({ cliente: '', tipo: 'Casamento', dataSessao: '', pacote: 'Básico', valor: '', validade: '', descricao: '', observacoes: '' })
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')
  const daysLeft = (v: string) => Math.ceil((new Date(v).getTime() - Date.now()) / 86400000)

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold" style={{ color: '#f8f8ff' }}>Orçamentos</h2>
            <p style={{ color: '#8b8b9e' }}>Gerencie seus orçamentos</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="px-6 py-2 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>Novo Orçamento</button>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="p-6 rounded-xl border flex items-center justify-between" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
              <div>
                <p className="text-sm mb-1" style={{ color: '#8b8b9e' }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: `${s.color}20` }}>{s.icon}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
          {quotes.map((q, i) => {
            const sc = getStatusColor(q.status)
            const initials = q.cliente.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            const days = daysLeft(q.validade)
            return (
              <div key={q.id} className="p-6 hover:bg-white hover:bg-opacity-5 transition-all" style={{ borderBottom: i < quotes.length - 1 ? '1px solid #1e1e2e' : 'none' }}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  <div className="flex items-center gap-4 lg:w-64">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ backgroundColor: getAvatarColor(q.cliente), color: '#f8f8ff' }}>{initials}</div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: '#f8f8ff' }}>{q.cliente}</h3>
                      <p className="text-sm" style={{ color: '#8b8b9e' }}>{q.tipo}</p>
                    </div>
                  </div>
                  <div className="lg:w-32">
                    <span className="font-semibold" style={{ color: '#a78bfa' }}>#{q.numero}</span>
                    <p className="text-sm" style={{ color: '#8b8b9e' }}>{fmtDate(q.dataEnvio)}</p>
                  </div>
                  <div className="lg:flex-1">
                    <p className="text-3xl font-bold" style={{ color: '#f8f8ff' }}>{fmt(q.valor)}</p>
                  </div>
                  <div className="lg:w-48">
                    <div className="flex justify-between text-sm mb-2">
                      <span style={{ color: '#8b8b9e' }}>Validade</span>
                      <span style={{ color: days > 0 ? '#34d399' : '#ef4444' }}>{days > 0 ? `${days} dias` : 'Expirado'}</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#1e1e2e' }}>
                      <div className="h-2 rounded-full" style={{ backgroundColor: days > 0 ? '#34d399' : '#ef4444', width: `${Math.min(Math.max(days / 30 * 100, 0), 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: sc.bg, color: sc.text }}>{q.status}</span>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg hover:opacity-80" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>👁</button>
                      <button className="p-2 rounded-lg hover:opacity-80" style={{ backgroundColor: '#a78bfa', color: '#f8f8ff' }}>✏</button>
                      <button onClick={() => setQuotes([...quotes, { ...q, id: quotes.length + 1, numero: String(quotes.length + 1).padStart(3, '0'), status: 'Pendente' }])} className="p-2 rounded-lg hover:opacity-80" style={{ backgroundColor: 'rgba(52,211,153,0.2)', color: '#34d399' }}>📋</button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#13131a' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#f8f8ff' }}>Novo Orçamento</h3>
                <button onClick={() => setModalOpen(false)} className="text-2xl hover:opacity-80" style={{ color: '#8b8b9e' }}>×</button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                {[
                  { label: 'Cliente', key: 'cliente', type: 'text', placeholder: 'Nome do cliente' },
                  { label: 'Valor (R$)', key: 'valor', type: 'number', placeholder: '0,00' },
                  { label: 'Data da sessão', key: 'dataSessao', type: 'date', placeholder: '' },
                  { label: 'Validade', key: 'validade', type: 'date', placeholder: '' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>{f.label}</label>
                    <input type={f.type} required placeholder={f.placeholder} value={(newQuote as Record<string, string>)[f.key]} onChange={e => setNewQuote({ ...newQuote, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Tipo de sessão</label>
                  <select value={newQuote.tipo} onChange={e => setNewQuote({ ...newQuote, tipo: e.target.value })} className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                    {['Casamento', 'Ensaio', 'Newborn', 'Aniversário', 'Corporativo', 'Outro'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Descrição dos serviços</label>
                  <textarea value={newQuote.descricao} onChange={e => setNewQuote({ ...newQuote, descricao: e.target.value })} rows={3} placeholder="Descreva os serviços..."
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none resize-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-3 rounded-lg font-semibold hover:opacity-80" style={{ backgroundColor: '#1e1e2e', color: '#f8f8ff' }}>Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-3 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>Salvar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
