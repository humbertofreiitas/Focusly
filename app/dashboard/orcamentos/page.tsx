'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import { createClient } from '@/utils/supabase/client'

interface Quote {
  id: string
  numero: string
  cliente: string
  tipo: string
  valor: number
  data_envio: string
  data_sessao: string
  validade: string
  descricao: string
  status: string
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

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-'
const daysLeft = (v: string) => Math.ceil((new Date(v + 'T00:00:00').getTime() - Date.now()) / 86400000)

export default function Orcamentos() {
  const [modalOpen, setModalOpen] = useState(false)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aprovando, setAprovando] = useState<string | null>(null)
  const [newQuote, setNewQuote] = useState({ cliente: '', tipo: 'Casamento', dataSessao: '', valor: '', validade: '', descricao: '' })
  const supabase = createClient()

  useEffect(() => { loadQuotes() }, [])

  const loadQuotes = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('orcamentos').select('*').order('created_at', { ascending: false })
    if (!error && data) setQuotes(data)
    setLoading(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Gera número sequencial
      const numero = String(quotes.length + 1).padStart(3, '0')

      const { data, error } = await supabase.from('orcamentos').insert([{
        numero,
        cliente: newQuote.cliente,
        tipo: newQuote.tipo,
        valor: parseFloat(newQuote.valor),
        data_sessao: newQuote.dataSessao || null,
        validade: newQuote.validade,
        descricao: newQuote.descricao,
        status: 'Pendente',
        user_id: user.id,
      }]).select().single()

      if (!error && data) {
        setQuotes([data, ...quotes])
        setModalOpen(false)
        setNewQuote({ cliente: '', tipo: 'Casamento', dataSessao: '', valor: '', validade: '', descricao: '' })
      }
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Atualiza status do orçamento
    const { error } = await supabase.from('orcamentos').update({ status: newStatus }).eq('id', id)
    if (error) return

    setQuotes(quotes.map(q => q.id === id ? { ...q, status: newStatus } : q))

    // Se aprovado → cria contrato automaticamente
    if (newStatus === 'Aprovado') {
      setAprovando(id)
      const quote = quotes.find(q => q.id === id)
      if (!quote) { setAprovando(null); return }

      // Verifica se já existe contrato para esse orçamento
      const { data: existing } = await supabase.from('contratos')
        .select('id').eq('cliente', quote.cliente).eq('valor', quote.valor).eq('tipo', quote.tipo)

      if (!existing || existing.length === 0) {
        const { error: contratoError } = await supabase.from('contratos').insert([{
          cliente: quote.cliente,
          tipo: quote.tipo,
          valor: quote.valor,
          data_sessao: quote.data_sessao || null,
          status: 'Aguardando',
          user_id: user.id,
        }])

        if (!contratoError) {
          alert(`✅ Orçamento aprovado! Contrato criado automaticamente em "Aguardando Assinatura".`)
        }
      }
      setAprovando(null)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('orcamentos').delete().eq('id', id)
    if (!error) setQuotes(quotes.filter(q => q.id !== id))
  }

  const stats = [
    { label: 'Total enviados', value: quotes.length, color: '#7c6af7', icon: '📊' },
    { label: 'Aguardando', value: quotes.filter(q => q.status === 'Pendente').length, color: '#fbbf24', icon: '⏳' },
    { label: 'Aprovados', value: quotes.filter(q => q.status === 'Aprovado').length, color: '#34d399', icon: '✅' },
    { label: 'Recusados', value: quotes.filter(q => q.status === 'Recusado').length, color: '#ef4444', icon: '❌' },
  ]

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold" style={{ color: '#f8f8ff' }}>Orçamentos</h2>
            <p style={{ color: '#8b8b9e' }}>Gerencie seus orçamentos</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="px-6 py-2 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>
            Novo Orçamento
          </button>
        </header>

        {/* Stats */}
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

        {/* Lista */}
        {loading ? (
          <div className="p-12 text-center" style={{ color: '#8b8b9e' }}>Carregando orçamentos...</div>
        ) : quotes.length === 0 ? (
          <div className="p-12 text-center rounded-xl border" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
            <p className="text-lg font-semibold mb-2" style={{ color: '#f8f8ff' }}>Nenhum orçamento ainda</p>
            <p style={{ color: '#8b8b9e' }}>Crie seu primeiro orçamento e envie para o cliente!</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
            {quotes.map((q, i) => {
              const sc = getStatusColor(q.status)
              const initials = q.cliente.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              const days = q.validade ? daysLeft(q.validade) : 0
              const isAprovando = aprovando === q.id

              return (
                <div key={q.id} className="p-6 hover:bg-white hover:bg-opacity-5 transition-all" style={{ borderBottom: i < quotes.length - 1 ? '1px solid #1e1e2e' : 'none' }}>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Cliente */}
                    <div className="flex items-center gap-4 lg:w-64">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ backgroundColor: getAvatarColor(q.cliente), color: '#f8f8ff' }}>{initials}</div>
                      <div>
                        <h3 className="font-bold text-lg" style={{ color: '#f8f8ff' }}>{q.cliente}</h3>
                        <p className="text-sm" style={{ color: '#8b8b9e' }}>{q.tipo}</p>
                        {q.data_sessao && <p className="text-xs" style={{ color: '#8b8b9e' }}>Sessão: {fmtDate(q.data_sessao)}</p>}
                      </div>
                    </div>

                    {/* Número */}
                    <div className="lg:w-32">
                      <span className="font-semibold" style={{ color: '#a78bfa' }}>#{q.numero}</span>
                      <p className="text-sm" style={{ color: '#8b8b9e' }}>{fmtDate(q.data_envio)}</p>
                    </div>

                    {/* Valor */}
                    <div className="lg:flex-1">
                      <p className="text-3xl font-bold" style={{ color: '#f8f8ff' }}>{fmt(q.valor)}</p>
                    </div>

                    {/* Validade */}
                    {q.validade && (
                      <div className="lg:w-48">
                        <div className="flex justify-between text-sm mb-2">
                          <span style={{ color: '#8b8b9e' }}>Validade</span>
                          <span style={{ color: days > 0 ? '#34d399' : '#ef4444' }}>{days > 0 ? `${days} dias` : 'Expirado'}</span>
                        </div>
                        <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#1e1e2e' }}>
                          <div className="h-2 rounded-full" style={{ backgroundColor: days > 0 ? '#34d399' : '#ef4444', width: `${Math.min(Math.max(days / 30 * 100, 0), 100)}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Status e ações */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <select
                        value={q.status}
                        disabled={isAprovando}
                        onChange={e => handleStatusChange(q.id, e.target.value)}
                        className="px-3 py-2 rounded-lg text-sm font-semibold border focus:outline-none"
                        style={{ backgroundColor: sc.bg, color: sc.text, borderColor: 'transparent' }}
                      >
                        {['Pendente', 'Aprovado', 'Recusado', 'Expirado'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>

                      {isAprovando && <span className="text-xs" style={{ color: '#a78bfa' }}>Criando contrato...</span>}

                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg hover:opacity-80" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }} title="Ver">👁</button>
                        <button onClick={() => handleDelete(q.id)} className="p-2 rounded-lg hover:opacity-80" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }} title="Excluir">🗑</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-xl p-6" style={{ backgroundColor: '#13131a', maxHeight: '90vh', overflowY: 'auto', scrollbarWidth: 'none' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#f8f8ff' }}>Novo Orçamento</h3>
                <button onClick={() => setModalOpen(false)} className="text-2xl hover:opacity-80" style={{ color: '#8b8b9e' }}>×</button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                {[
                  { label: 'Cliente', key: 'cliente', type: 'text', placeholder: 'Nome do cliente' },
                  { label: 'Valor (R$)', key: 'valor', type: 'number', placeholder: '0,00' },
                  { label: 'Data da sessão', key: 'dataSessao', type: 'date', placeholder: '' },
                  { label: 'Validade do orçamento', key: 'validade', type: 'date', placeholder: '' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>{f.label}</label>
                    <input type={f.type} required={f.key !== 'dataSessao'} placeholder={f.placeholder}
                      value={(newQuote as Record<string, string>)[f.key]}
                      onChange={e => setNewQuote({ ...newQuote, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none"
                      style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Tipo de sessão</label>
                  <select value={newQuote.tipo} onChange={e => setNewQuote({ ...newQuote, tipo: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none"
                    style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                    {['Casamento', 'Ensaio', 'Newborn', 'Aniversário', 'Corporativo', 'Outro'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Descrição dos serviços</label>
                  <textarea value={newQuote.descricao} onChange={e => setNewQuote({ ...newQuote, descricao: e.target.value })} rows={3}
                    placeholder="Descreva o que está incluso no pacote..."
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none resize-none"
                    style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
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