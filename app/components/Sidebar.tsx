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

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg"
        style={{ backgroundColor: '#13131a', color: '#f8f8ff' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
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
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full hover:opacity-80"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
          >
            <span>🚪</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}
    </>
  )
}