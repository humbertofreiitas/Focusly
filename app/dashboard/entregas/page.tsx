'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  'Em edição': { label: 'Em edição', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: '✏️' },
  'Aguardando aprovação': { label: 'Aguardando', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', icon: '⏳' },
  'Aprovado': { label: 'Aprovado', color: '#34d399', bg: 'rgba(52,211,153,0.15)', icon: '✅' },
  'Entregue': { label: 'Entregue', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', icon: '🎉' },
}

const tipoEmoji: Record<string, string> = {
  'Casamento': '💍',
  'Newborn': '👶',
  'Aniversário': '🎂',
  'Corporativo': '💼',
  'Ensaio': '📸',
}

export default function Entregas() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('Todos')
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const menuItems = [
    { name: 'Dashboard', icon: '📊', href: '/dashboard' },
    { name: 'Clientes', icon: '👥', href: '/dashboard/clientes' },
    { name: 'Agenda', icon: '📅', href: '/dashboard/agenda' },
    { name: 'Orçamentos', icon: '💰', href: '/dashboard/orcamentos' },
    { name: 'Contratos', icon: '📄', href: '/dashboard/contratos' },
    { name: 'Financeiro', icon: '💳', href: '/dashboard/financeiro' },
    { name: 'Entregas', icon: '📦', href: '/dashboard/entregas' },
  ]

  const [deliveries, setDeliveries] = useState([
    { id: 1, cliente: 'Maria Silva', tipo: 'Casamento', dataSessao: '2026-05-14', totalFotos: 500, editadas: 500, status: 'Entregue', prazo: '2026-05-29', diasRestantes: -2 },
    { id: 2, cliente: 'João Santos', tipo: 'Corporativo', dataSessao: '2026-05-17', totalFotos: 100, editadas: 100, status: 'Aprovado', prazo: '2026-05-31', diasRestantes: 4 },
    { id: 3, cliente: 'Ana Costa', tipo: 'Aniversário', dataSessao: '2026-05-19', totalFotos: 150, editadas: 120, status: 'Aguardando aprovação', prazo: '2026-06-04', diasRestantes: 8 },
    { id: 4, cliente: 'Pedro Lima', tipo: 'Newborn', dataSessao: '2026-05-21', totalFotos: 80, editadas: 30, status: 'Em edição', prazo: '2026-06-09', diasRestantes: 13 },
    { id: 5, cliente: 'Carla Oliveira', tipo: 'Ensaio', dataSessao: '2026-05-24', totalFotos: 60, editadas: 45, status: 'Em edição', prazo: '2026-06-14', diasRestantes: 18 },
  ])

  const [newDelivery, setNewDelivery] = useState({ cliente: '', tipo: 'Casamento', totalFotos: '', prazo: '', observacoes: '' })

  const filtrados = filtroStatus === 'Todos' ? deliveries : deliveries.filter(d => d.status === filtroStatus)

  const handleUpdateStatus = (id: number) => {
    const ordem = ['Em edição', 'Aguardando aprovação', 'Aprovado', 'Entregue']
    setDeliveries(deliveries.map(d => {
      if (d.id === id) {
        const idx = ordem.indexOf(d.status)
        return { ...d, status: idx < ordem.length - 1 ? ordem[idx + 1] : d.status }
      }
      return d
    }))
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setDeliveries([...deliveries, {
      id: deliveries.length + 1,
      cliente: newDelivery.cliente,
      tipo: newDelivery.tipo,
      dataSessao: new Date().toISOString().split('T')[0],
      totalFotos: parseInt(newDelivery.totalFotos),
      editadas: 0,
      status: 'Em edição',
      prazo: newDelivery.prazo,
      diasRestantes: 30,
    }])
    setModalOpen(false)
    setNewDelivery({ cliente: '', tipo: 'Casamento', totalFotos: '', prazo: '', observacoes: '' })
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')
  const getInitials = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Mobile toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg" style={{ backgroundColor: '#13131a', color: '#f8f8ff' }}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: '#13131a', borderRight: '1px solid #1e1e2e' }}>
        <div className="p-6">
          <h1 className="text-2xl font-bold" style={{ color: '#a78bfa' }}>Focusly</h1>
        </div>
        <nav className="px-4 space-y-2">
          {menuItems.map(item => (
            <a key={item.name} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:opacity-80" style={{ backgroundColor: item.name === 'Entregas' ? '#7c6af7' : 'transparent', color: '#f8f8ff' }}>
              <span className="text-xl">{item.icon}</span>
              <span>{item.name}</span>
            </a>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg w-full hover:opacity-80" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            <span>🚪</span><span>Sair</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 p-4 lg:p-8">

        {/* Header */}
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
            <div key={key} className="p-5 rounded-xl border flex items-center gap-4 cursor-pointer hover:opacity-80 transition-all" style={{ backgroundColor: '#13131a', borderColor: filtroStatus === key ? cfg.color : '#1e1e2e' }} onClick={() => setFiltroStatus(filtroStatus === key ? 'Todos' : key)}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: cfg.bg }}>{cfg.icon}</div>
              <div>
                <p className="text-2xl font-bold" style={{ color: cfg.color }}>{deliveries.filter(d => d.status === key).length}</p>
                <p className="text-xs" style={{ color: '#8b8b9e' }}>{cfg.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtro ativo */}
        {filtroStatus !== 'Todos' && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm" style={{ color: '#8b8b9e' }}>Filtrando por:</span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: statusConfig[filtroStatus]?.bg, color: statusConfig[filtroStatus]?.color }}>{filtroStatus}</span>
            <button onClick={() => setFiltroStatus('Todos')} className="text-xs hover:opacity-80" style={{ color: '#8b8b9e' }}>✕ Limpar</button>
          </div>
        )}

        {/* Cards de entrega */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtrados.map(d => {
            const cfg = statusConfig[d.status]
            const progresso = Math.round((d.editadas / d.totalFotos) * 100)
            const emoji = tipoEmoji[d.tipo] || '📸'
            return (
              <div key={d.id} className="rounded-2xl border overflow-hidden transition-all hover:scale-[1.02]" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>

                {/* Topo colorido */}
                <div className="h-2" style={{ backgroundColor: cfg.color }} />

                {/* Conteúdo */}
                <div className="p-6">
                  {/* Cliente */}
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

                  {/* Progresso de fotos */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm" style={{ color: '#8b8b9e' }}>Fotos editadas</span>
                      <span className="text-sm font-bold" style={{ color: '#f8f8ff' }}>{d.editadas}/{d.totalFotos}</span>
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
                      <p className="text-sm font-semibold" style={{ color: '#f8f8ff' }}>{formatDate(d.dataSessao)}</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#0a0a0f' }}>
                      <p className="text-xs mb-1" style={{ color: '#8b8b9e' }}>Prazo</p>
                      <p className="text-sm font-semibold" style={{ color: d.diasRestantes < 0 ? '#ef4444' : d.diasRestantes < 5 ? '#fbbf24' : '#34d399' }}>
                        {d.diasRestantes < 0 ? `${Math.abs(d.diasRestantes)}d atrasado` : d.diasRestantes === 0 ? 'Hoje!' : `${d.diasRestantes}d restantes`}
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-lg text-sm font-semibold hover:opacity-80" style={{ backgroundColor: '#1e1e2e', color: '#f8f8ff' }}>Ver</button>
                    <button onClick={() => handleUpdateStatus(d.id)} className="flex-1 py-2 rounded-lg text-sm font-semibold hover:opacity-80" style={{ backgroundColor: cfg.bg, color: cfg.color }}>Avançar</button>
                    <button className="flex-1 py-2 rounded-lg text-sm font-semibold hover:opacity-80" style={{ backgroundColor: 'rgba(52,211,153,0.15)', color: '#34d399' }}>Enviar</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#13131a' }}>
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
                    <input type={f.type} required value={(newDelivery as Record<string, string>)[f.key]} onChange={e => setNewDelivery({ ...newDelivery, [f.key]: e.target.value })} placeholder={f.placeholder}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none transition-all"
                      style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Tipo de sessão</label>
                  <select value={newDelivery.tipo} onChange={e => setNewDelivery({ ...newDelivery, tipo: e.target.value })} className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                    {Object.keys(tipoEmoji).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Observações</label>
                  <textarea value={newDelivery.observacoes} onChange={e => setNewDelivery({ ...newDelivery, observacoes: e.target.value })} rows={3} placeholder="Observações..."
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none resize-none"
                    style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
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
