'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const menuItems = [
  { name: 'Dashboard', icon: '📊', href: '/dashboard' },
  { name: 'Clientes', icon: '👥', href: '/dashboard/clientes' },
  { name: 'Agenda', icon: '📅', href: '/dashboard/agenda' },
  { name: 'Orçamentos', icon: '💰', href: '/dashboard/orcamentos' },
  { name: 'Contratos', icon: '📄', href: '/dashboard/contratos' },
  { name: 'Financeiro', icon: '💳', href: '/dashboard/financeiro' },
  { name: 'Entregas', icon: '📦', href: '/dashboard/entregas' },
]

const stats = [
  { label: 'Total de clientes', value: '24', color: '#7c6af7' },
  { label: 'Sessões este mês', value: '8', color: '#34d399' },
  { label: 'Receita do mês', value: 'R$ 12.450', color: '#a78bfa' },
  { label: 'Entregas pendentes', value: '3', color: '#f87171' },
]

const upcomingSessions = [
  { client: 'Maria Silva', type: 'Casamento', date: '15/06/2026', time: '14:00', location: 'Igreja Matriz' },
  { client: 'João Santos', type: 'Ensaio Corporativo', date: '18/06/2026', time: '10:00', location: 'Escritório Central' },
  { client: 'Ana Costa', type: 'Aniversário', date: '20/06/2026', time: '16:00', location: 'Salão de Festas' },
  { client: 'Pedro Lima', type: 'Newborn', date: '22/06/2026', time: '09:00', location: 'Estúdio' },
]

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
          {sidebarOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#13131a', borderRight: '1px solid #1e1e2e' }}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold" style={{ color: '#a78bfa' }}>Focusly</h1>
        </div>

        <nav className="px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:opacity-90"
                style={{
                  backgroundColor: isActive ? '#7c6af7' : 'transparent',
                  color: '#f8f8ff',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </a>
            )
          })}
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

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#f8f8ff' }}>Olá, Fotógrafo!</h2>
            <p style={{ color: '#8b8b9e' }}>Bem-vindo ao seu painel de controle</p>
          </div>
          <button
            onClick={handleLogout}
            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:opacity-80"
            style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}
          >
            Sair
          </button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="p-6 rounded-xl border" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
              <p className="text-sm mb-2" style={{ color: '#8b8b9e' }}>{stat.label}</p>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Upcoming Sessions */}
        <div className="p-6 rounded-xl border" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
          <h3 className="text-xl font-bold mb-6" style={{ color: '#f8f8ff' }}>Próximas Sessões</h3>
          <div className="space-y-4">
            {upcomingSessions.map((session, i) => (
              <div key={i} className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: '#7c6af7' }}>📷</div>
                  <div>
                    <p className="font-semibold" style={{ color: '#f8f8ff' }}>{session.client}</p>
                    <p className="text-sm" style={{ color: '#8b8b9e' }}>{session.type}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-1">
                  <p className="text-sm" style={{ color: '#a78bfa' }}>{session.date} às {session.time}</p>
                  <p className="text-sm" style={{ color: '#8b8b9e' }}>{session.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}