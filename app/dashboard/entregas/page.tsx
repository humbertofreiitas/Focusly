'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import { createClient } from '@/utils/supabase/client'

interface Entrega {
  id: string
  cliente: string
  tipo: string
  data_sessao: string
  total_fotos: number
  editadas: number
  status: string
  prazo: string
  observacoes: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  'Em edição': { label: 'Em edição', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: '✏️' },
  'Aguardando aprovação': { label: 'Aguardando', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', icon: '⏳' },
  'Aprovado': { label: 'Aprovado', color: '#34d399', bg: 'rgba(52,211,153,0.15)', icon: '✅' },
  'Entregue': { label: 'Entregue', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', icon: '🎉' },
}

const tipoEmoji: Record<string, string> = {
  'Casamento': '💍', 'Newborn': '👶', 'Aniversário': '🎂',
  'Corporativo': '💼', 'Ensaio': '📸', 'Outro': '📷',
}

const fmtDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-'
const getInitials = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)
const getDaysLeft = (prazo: string) => Math.ceil((new Date(prazo + 'T00:00:00').getTime() - Date.now()) / 86400000)

export default function Entregas() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editModal, setEditModal] = useState<Entrega | null>(null)
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const [deliveries, setDeliveries] = useState<Entrega[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newDelivery, setNewDelivery] = useState({ cliente: '', tipo: 'Casamento', totalFotos: '', prazo: '', observacoes: '' })
  const supabase = createClient()

  useEffect(() => { loadDeliveries() }, [])

  const loadDeliveries = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('entregas').select('*').order('prazo', { ascending: true })
    if (!error && data) setDeliveries(data)
    setLoading(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from('entregas').insert([{
        cliente: newDelivery.cliente,
        tipo: newDelivery.tipo,
        total_fotos: parseInt(newDelivery.totalFotos),
        editadas: 0,
        prazo: newDelivery.prazo,
        observacoes: newDelivery.observacoes,
        status: 'Em edição',
        user_id: user.id,
      }]).select().single()

      if (!error && data) {
        setDeliveries([...deliveries, data])
        setModalOpen(false)
        setNewDelivery({ cliente: '', tipo: 'Casamento', totalFotos: '', prazo: '', observacoes: '' })
      }
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleUpdateStatus = async (id: string) => {
    const ordem = ['Em edição', 'Aguardando aprovação', 'Aprovado', 'Entregue']
    const delivery = deliveries.find(d => d.id === id)
    if (!delivery) return
    const idx = ordem.indexOf(delivery.status)
    if (idx >= ordem.length - 1) return
    const newStatus = ordem[idx + 1]
    const { error } = await supabase.from('entregas').update({ status: newStatus }).eq('id', id)
    if (!error) setDeliveries(deliveries.map(d => d.id === id ? { ...d, status: newStatus } : d))
  }

  const handleUpdateEditadas = async (id: string, editadas: number) => {
    const { error } = await supabase.from('entregas').update({ editadas }).eq('id', id)
    if (!error) setDeliveries(deliveries.map(d => d.id === id ? { ...d, editadas } : d))
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('entregas').delete().eq('id', id)
    if (!error) setDeliveries(deliveries.filter(d => d.id !== id))
  }

  const filtrados = filtroStatus === 'Todos' ? deliveries : deliveries.filter(d => d.status === filtroStatus)

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#f8f8ff' }}>Entregas</h2>
            <p style={{ color: '#8b8b9e' }}>Acompanhe o progresso das suas edições</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="px-6 py-2 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>
            Nova Entrega
          </button>
        </header>

        {/* Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <div key={key} onClick={() => setFiltroStatus(filtroStatus === key ? 'Todos' : key)}
              className="p-5 rounded-xl border flex items-center gap-4 cursor-pointer hover:opacity-80 transition-all"
              style={{ backgroundColor: '#13131a', borderColor: filtroStatus === key ? cfg.color : '#1e1e2e' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: cfg.bg }}>{cfg.icon}</div>
              <div>
                <p className="text-2xl font-bold" style={{ color: cfg.color }}>{deliveries.filter(d => d.status === key).length}</p>
                <p className="text-xs" style={{ color: '#8b8b9e' }}>{cfg.label}</p>
              </div>
            </div>
          ))}
        </div>

        {filtroStatus !== 'Todos' && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm" style={{ color: '#8b8b9e' }}>Filtrando por:</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: statusConfig[filtroStatus]?.bg, color: statusConfig[filtroStatus]?.color }}>{filtroStatus}</span>
            <button onClick={() => setFiltroStatus('Todos')} className="text-xs hover:opacity-80" style={{ color: '#8b8b9e' }}>✕ Limpar</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12" style={{ color: '#8b8b9e' }}>Carregando entregas...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 rounded-xl border" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
            <p className="text-lg font-semibold mb-2" style={{ color: '#f8f8ff' }}>Nenhuma entrega ainda</p>
            <p style={{ color: '#8b8b9e' }}>Crie sua primeira entrega para acompanhar o progresso!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtrados.map(d => {
              const cfg = statusConfig[d.status] || statusConfig['Em edição']
              const progresso = d.total_fotos > 0 ? Math.round((d.editadas / d.total_fotos) * 100) : 0
              const emoji = tipoEmoji[d.tipo] || '📸'
              const dias = d.prazo ? getDaysLeft(d.prazo) : null

              return (
                <div key={d.id} className="rounded-2xl border overflow-hidden transition-all hover:scale-[1.02]" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
                  <div className="h-2" style={{ backgroundColor: cfg.color }} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>
                          {getInitials(d.cliente)}
                        </div>
                        <div>
                          <h3 className="font-bold" style={{ color: '#f8f8ff' }}>{d.cliente}</h3>
                          <p className="text-sm" style={{ color: '#8b8b9e' }}>{emoji} {d.tipo}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    </div>

                    {/* Progresso */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm" style={{ color: '#8b8b9e' }}>Fotos editadas</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min="0" max={d.total_fotos}
                            value={d.editadas}
                            onChange={e => handleUpdateEditadas(d.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-right text-sm font-bold rounded px-1 focus:outline-none"
                            style={{ backgroundColor: '#0a0a0f', color: '#f8f8ff', border: '1px solid #1e1e2e' }}
                          />
                          <span className="text-sm font-bold" style={{ color: '#f8f8ff' }}>/{d.total_fotos}</span>
                        </div>
                      </div>
                      <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#1e1e2e' }}>
                        <div className="h-3 rounded-full transition-all" style={{ width: `${progresso}%`, backgroundColor: cfg.color }} />
                      </div>
                      <p className="text-right text-xs mt-1 font-semibold" style={{ color: cfg.color }}>{progresso}%</p>
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: '#0a0a0f' }}>
                        <p className="text-xs mb-1" style={{ color: '#8b8b9e' }}>Data da sessão</p>
                        <p className="text-sm font-semibold" style={{ color: '#f8f8ff' }}>{fmtDate(d.data_sessao)}</p>
                      </div>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: '#0a0a0f' }}>
                        <p className="text-xs mb-1" style={{ color: '#8b8b9e' }}>Prazo</p>
                        <p className="text-sm font-semibold" style={{ color: dias === null ? '#8b8b9e' : dias < 0 ? '#ef4444' : dias < 5 ? '#fbbf24' : '#34d399' }}>
                          {dias === null ? '-' : dias < 0 ? `${Math.abs(dias)}d atrasado` : dias === 0 ? 'Hoje!' : `${dias}d restantes`}
                        </p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateStatus(d.id)} className="flex-1 py-2 rounded-lg text-xs font-semibold hover:opacity-80" style={{ backgroundColor: cfg.bg, color: cfg.color }}>Avançar</button>
                      <button onClick={() => handleDelete(d.id)} className="px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-80" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Excluir</button>
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
                <h3 className="text-xl font-bold" style={{ color: '#f8f8ff' }}>Nova Entrega</h3>
                <button onClick={() => setModalOpen(false)} className="text-2xl hover:opacity-80" style={{ color: '#8b8b9e' }}>×</button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                {[
                  { label: 'Cliente', key: 'cliente', type: 'text', placeholder: 'Nome do cliente' },
                  { label: 'Total de fotos', key: 'totalFotos', type: 'number', placeholder: 'Quantidade estimada' },
                  { label: 'Prazo de entrega', key: 'prazo', type: 'date', placeholder: '' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>{f.label}</label>
                    <input type={f.type} required placeholder={f.placeholder}
                      value={(newDelivery as Record<string, string>)[f.key]}
                      onChange={e => setNewDelivery({ ...newDelivery, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none"
                      style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Tipo de sessão</label>
                  <select value={newDelivery.tipo} onChange={e => setNewDelivery({ ...newDelivery, tipo: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none"
                    style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                    {Object.keys(tipoEmoji).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Observações</label>
                  <textarea value={newDelivery.observacoes} onChange={e => setNewDelivery({ ...newDelivery, observacoes: e.target.value })} rows={3}
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