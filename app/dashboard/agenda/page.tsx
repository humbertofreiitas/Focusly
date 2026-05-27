'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Sidebar from '../../components/Sidebar'
import { createClient } from '@/utils/supabase/client'

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Sessao {
  id: string
  cliente_nome: string
  tipo: string
  data: string
  horario_inicio: string
  horario_fim: string
  local: string
  status: string
  observacoes: string
  origem?: string
}

const tipoColors: Record<string, string> = {
  'Casamento': '#7c6af7',
  'Ensaio': '#3b82f6',
  'Newborn': '#f472b6',
  'Aniversário': '#fbbf24',
  'Corporativo': '#34d399',
  'Outro': '#94a3b8',
  'Google Calendar': '#34d399',
}

// Formata hora removendo segundos — "09:00:00" → "09:00"
const fmtHora = (h: string) => h ? h.slice(0, 5) : ''

export default function Agenda() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editSession, setEditSession] = useState<Sessao | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [googleEvents, setGoogleEvents] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncGoogle, setSyncGoogle] = useState(true)
  const [newSession, setNewSession] = useState({ cliente_nome: '', tipo: 'Casamento', data: '', horario_inicio: '', horario_fim: '', local: '', observacoes: '' })
  const { data: googleSession } = useSession()
  const supabase = createClient()

  useEffect(() => { loadSessoes() }, [])
  useEffect(() => { if (googleSession?.accessToken) loadGoogleEvents() }, [googleSession])

  const loadSessoes = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('sessoes').select('*').order('data', { ascending: true })
    if (!error && data) setSessoes(data)
    setLoading(false)
  }

  const loadGoogleEvents = async () => {
    if (!googleSession?.accessToken) return
    try {
      const res = await fetch('/api/calendar', { headers: { Authorization: `Bearer ${googleSession.accessToken}` } })
      const data = await res.json()
      if (data.events) setGoogleEvents(data.events)
    } catch (err) { console.error(err) }
  }

  const allSessoes = [
    ...sessoes.map(s => ({ ...s, origem: 'focusly' })),
    ...googleEvents.filter(ge => !sessoes.some(s => s.data === ge.data && s.cliente_nome === ge.cliente_nome)),
  ]

  const createGoogleEvent = async (session: typeof newSession) => {
    if (!googleSession?.accessToken) return
    try {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${googleSession.accessToken}` },
        body: JSON.stringify({
          summary: `📸 ${session.tipo} - ${session.cliente_nome}`,
          description: session.observacoes || `Sessão de ${session.tipo} com ${session.cliente_nome}`,
          location: session.local,
          start: `${session.data}T${session.horario_inicio}:00`,
          end: `${session.data}T${session.horario_fim}:00`,
        }),
      })
    } catch (err) { console.error(err) }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data, error } = await supabase.from('sessoes').insert([{ ...newSession, user_id: user.id, status: 'Agendado' }]).select().single()
      if (!error && data) {
        setSessoes([...sessoes, data])
        if (syncGoogle && googleSession?.accessToken) await createGoogleEvent(newSession)
        setModalOpen(false)
        setNewSession({ cliente_nome: '', tipo: 'Casamento', data: '', horario_inicio: '', horario_fim: '', local: '', observacoes: '' })
      }
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editSession) return
    setSaving(true)
    try {
      const { data, error } = await supabase.from('sessoes').update({
        cliente_nome: editSession.cliente_nome,
        tipo: editSession.tipo,
        data: editSession.data,
        horario_inicio: editSession.horario_inicio,
        horario_fim: editSession.horario_fim,
        local: editSession.local,
        observacoes: editSession.observacoes,
      }).eq('id', editSession.id).select().single()
      if (!error && data) {
        setSessoes(sessoes.map(s => s.id === data.id ? data : s))
        setEditSession(null)
      }
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('sessoes').delete().eq('id', id)
    if (!error) {
      setSessoes(sessoes.filter(s => s.id !== id))
      setEditSession(null)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i))
    return days
  }

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return allSessoes.filter(s => s.data === dateStr)
  }

  const getMonthSessions = () => {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    return allSessoes.filter(s => {
      const d = new Date(s.data + 'T00:00:00')
      return d.getFullYear() === y && d.getMonth() === m
    })
  }

  const selectedDaySessions = selectedDay ? allSessoes.filter(s => s.data === selectedDay) : []
  const days = getDaysInMonth(currentDate)
  const monthSessions = getMonthSessions()
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8" style={{ overflowX: 'hidden' }}>
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#f8f8ff' }}>Agenda</h2>
            <p style={{ color: '#8b8b9e' }}>Gerencie suas sessões</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            {!googleSession ? (
              <button onClick={() => signIn('google')} className="px-4 py-2 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#1e1e2e', color: '#f8f8ff' }}>
                📅 Conectar Google Calendar
              </button>
            ) : (
              <button onClick={loadGoogleEvents} className="px-4 py-2 rounded-lg text-sm hover:opacity-80" style={{ backgroundColor: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                🔄 Sincronizar
              </button>
            )}
            <button onClick={() => setModalOpen(true)} className="px-6 py-2 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>
              + Nova Sessão
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-2 rounded-xl border overflow-hidden" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#1e1e2e' }}>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 rounded-lg hover:opacity-80" style={{ backgroundColor: '#1e1e2e', color: '#f8f8ff' }}>‹</button>
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold" style={{ color: '#f8f8ff' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 rounded-lg text-xs font-semibold hover:opacity-80" style={{ backgroundColor: '#1e1e2e', color: '#8b8b9e' }}>Hoje</button>
              </div>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 rounded-lg hover:opacity-80" style={{ backgroundColor: '#1e1e2e', color: '#f8f8ff' }}>›</button>
            </div>
            <div className="grid grid-cols-7 border-b" style={{ borderColor: '#1e1e2e' }}>
              {dayNames.map(d => <div key={d} className="text-center text-xs font-semibold py-3" style={{ color: '#8b8b9e' }}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                if (!day) return <div key={i} className="border-r border-b" style={{ borderColor: '#1e1e2e', minHeight: '80px' }} />
                const dateStr = day.toISOString().split('T')[0]
                const daySessions = getSessionsForDate(day)
                const isToday = dateStr === today
                const isSelected = dateStr === selectedDay
                const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                return (
                  <div key={i} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    className="border-r border-b cursor-pointer transition-all hover:opacity-90"
                    style={{ borderColor: '#1e1e2e', minHeight: '80px', backgroundColor: isSelected ? 'rgba(124,106,247,0.1)' : 'transparent' }}>
                    <div className="p-1">
                      <div className="flex justify-center mb-1">
                        <span className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium"
                          style={{ backgroundColor: isToday ? '#7c6af7' : 'transparent', color: isToday ? '#fff' : isCurrentMonth ? '#f8f8ff' : '#3a3a4a', fontWeight: isToday ? 700 : 400 }}>
                          {day.getDate()}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {daySessions.slice(0, 2).map((s, j) => (
                          <div key={j} className="text-xs px-1 py-0.5 rounded truncate"
                            style={{ backgroundColor: `${tipoColors[s.tipo] || '#7c6af7'}30`, color: tipoColors[s.tipo] || '#7c6af7', fontSize: '10px' }}>
                            {fmtHora(s.horario_inicio)} {s.cliente_nome}
                          </div>
                        ))}
                        {daySessions.length > 2 && <div className="text-xs px-1" style={{ color: '#8b8b9e', fontSize: '10px' }}>+{daySessions.length - 2} mais</div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Painel lateral */}
          <div className="space-y-4">
            {googleSession && (
              <div className="p-4 rounded-xl border" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: '#f8f8ff' }}>Tipos de sessão</p>
                <div className="space-y-2">
                  {Object.entries(tipoColors).filter(([k]) => k !== 'Google Calendar').map(([tipo, cor]) => (
                    <div key={tipo} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: cor }} />
                      <span className="text-xs" style={{ color: '#8b8b9e' }}>{tipo}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: '#34d399' }} />
                    <span className="text-xs" style={{ color: '#8b8b9e' }}>Google Calendar</span>
                  </div>
                </div>
              </div>
            )}

            {selectedDay && (
              <div className="p-4 rounded-xl border" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: '#f8f8ff' }}>
                  {new Date(selectedDay + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {selectedDaySessions.length === 0 ? (
                  <p className="text-sm" style={{ color: '#8b8b9e' }}>Nenhuma sessão neste dia</p>
                ) : (
                  <div className="space-y-3">
                    {selectedDaySessions.map((s, i) => (
                      <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: '#0a0a0f', borderLeft: `3px solid ${tipoColors[s.tipo] || '#7c6af7'}` }}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold" style={{ color: '#f8f8ff' }}>{s.cliente_nome}</p>
                          {s.origem === 'google' && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(52,211,153,0.2)', color: '#34d399' }}>Google</span>}
                        </div>
                        <p className="text-xs mt-1" style={{ color: '#8b8b9e' }}>{s.tipo} • {fmtHora(s.horario_inicio)} - {fmtHora(s.horario_fim)}</p>
                        {s.local && <p className="text-xs mt-0.5" style={{ color: '#8b8b9e' }}>📍 {s.local}</p>}
                        {s.origem !== 'google' && (
                          <div className="flex gap-3 mt-2">
                            <button onClick={() => setEditSession(s)} className="text-xs hover:opacity-80" style={{ color: '#a78bfa' }}>Editar</button>
                            <button onClick={() => handleDelete(s.id)} className="text-xs hover:opacity-80" style={{ color: '#ef4444' }}>Excluir</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="p-4 rounded-xl border" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#f8f8ff' }}>
                {monthNames[currentDate.getMonth()]} — {monthSessions.length} sessões
              </p>
              {loading ? (
                <p className="text-sm" style={{ color: '#8b8b9e' }}>Carregando...</p>
              ) : monthSessions.length === 0 ? (
                <p className="text-sm" style={{ color: '#8b8b9e' }}>Nenhuma sessão este mês</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {monthSessions.sort((a, b) => a.data.localeCompare(b.data)).map((s, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: '#1e1e2e' }}>
                      <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: tipoColors[s.tipo] || '#7c6af7' }} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#f8f8ff' }}>{s.cliente_nome}</p>
                        <p className="text-xs" style={{ color: '#8b8b9e' }}>{new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} {fmtHora(s.horario_inicio)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Nova Sessão */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-xl p-6" style={{ backgroundColor: '#13131a', maxHeight: '90vh', overflowY: 'auto', scrollbarWidth: 'none' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#f8f8ff' }}>Nova Sessão</h3>
                <button onClick={() => setModalOpen(false)} className="text-2xl hover:opacity-80" style={{ color: '#8b8b9e' }}>×</button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                {[
                  { label: 'Cliente', key: 'cliente_nome', type: 'text', placeholder: 'Nome do cliente' },
                  { label: 'Data', key: 'data', type: 'date', placeholder: '' },
                  { label: 'Local', key: 'local', type: 'text', placeholder: 'Endereço ou nome do local' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>{f.label}</label>
                    <input type={f.type} required placeholder={f.placeholder}
                      value={(newSession as Record<string, string>)[f.key]}
                      onChange={e => setNewSession({ ...newSession, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none"
                      style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Tipo de sessão</label>
                  <select value={newSession.tipo} onChange={e => setNewSession({ ...newSession, tipo: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none"
                    style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                    {['Casamento', 'Ensaio', 'Newborn', 'Aniversário', 'Corporativo', 'Outro'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Horário início</label>
                    <input type="time" required value={newSession.horario_inicio} onChange={e => setNewSession({ ...newSession, horario_inicio: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Horário fim</label>
                    <input type="time" required value={newSession.horario_fim} onChange={e => setNewSession({ ...newSession, horario_fim: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Observações</label>
                  <textarea value={newSession.observacoes} onChange={e => setNewSession({ ...newSession, observacoes: e.target.value })} rows={3}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none resize-none"
                    style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                </div>
                {googleSession && (
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e1e2e' }}>
                    <input type="checkbox" id="syncGoogle" checked={syncGoogle} onChange={e => setSyncGoogle(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                    <label htmlFor="syncGoogle" className="text-sm cursor-pointer" style={{ color: '#f8f8ff' }}>📅 Adicionar ao Google Calendar</label>
                  </div>
                )}
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

        {/* Modal Editar Sessão */}
        {editSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-xl p-6" style={{ backgroundColor: '#13131a', maxHeight: '90vh', overflowY: 'auto', scrollbarWidth: 'none' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#f8f8ff' }}>Editar Sessão</h3>
                <button onClick={() => setEditSession(null)} className="text-2xl hover:opacity-80" style={{ color: '#8b8b9e' }}>×</button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Cliente</label>
                  <input type="text" required value={editSession.cliente_nome} onChange={e => setEditSession({ ...editSession, cliente_nome: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Tipo de sessão</label>
                  <select value={editSession.tipo} onChange={e => setEditSession({ ...editSession, tipo: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                    {['Casamento', 'Ensaio', 'Newborn', 'Aniversário', 'Corporativo', 'Outro'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Data</label>
                  <input type="date" required value={editSession.data} onChange={e => setEditSession({ ...editSession, data: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Horário início</label>
                    <input type="time" required value={fmtHora(editSession.horario_inicio)} onChange={e => setEditSession({ ...editSession, horario_inicio: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Horário fim</label>
                    <input type="time" required value={fmtHora(editSession.horario_fim)} onChange={e => setEditSession({ ...editSession, horario_fim: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Local</label>
                  <input type="text" value={editSession.local} onChange={e => setEditSession({ ...editSession, local: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Observações</label>
                  <textarea value={editSession.observacoes} onChange={e => setEditSession({ ...editSession, observacoes: e.target.value })} rows={3}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none resize-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditSession(null)} className="flex-1 px-4 py-3 rounded-lg font-semibold hover:opacity-80" style={{ backgroundColor: '#1e1e2e', color: '#f8f8ff' }}>Cancelar</button>
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