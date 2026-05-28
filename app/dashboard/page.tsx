'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import { createClient } from '@/utils/supabase/client'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtHora = (h: string) => h ? h.slice(0, 5) : ''

export default function Dashboard() {
  const [userName, setUserName] = useState('')
  const [totalClientes, setTotalClientes] = useState(0)
  const [sessoesDoMes, setSessoesDoMes] = useState(0)
  const [receitaMes, setReceitaMes] = useState(0)
  const [orcamentosPendentes, setOrcamentosPendentes] = useState(0)
  const [proximasSessoes, setProximasSessoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    // Nome do usuário
    setUserName(user.email?.split('@')[0]?.split('.')[0] || 'Fotógrafo')

    const now = new Date()
    const mesAtual = now.getMonth()
    const anoAtual = now.getFullYear()
    const inicioMes = new Date(anoAtual, mesAtual, 1).toISOString().split('T')[0]
    const fimMes = new Date(anoAtual, mesAtual + 1, 0).toISOString().split('T')[0]
    const hoje = now.toISOString().split('T')[0]

    // Total de clientes
    const { count: clientesCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
    setTotalClientes(clientesCount || 0)

    // Sessões do mês
    const { count: sessoesCount } = await supabase.from('sessoes').select('*', { count: 'exact', head: true })
      .gte('data', inicioMes).lte('data', fimMes)
    setSessoesDoMes(sessoesCount || 0)

    // Receita do mês (contratos assinados)
    const { data: contratos } = await supabase.from('contratos').select('valor')
      .eq('status', 'Assinado').gte('created_at', `${inicioMes}T00:00:00`)
    const receita = (contratos || []).reduce((s: number, c: any) => s + c.valor, 0)
    setReceitaMes(receita)

    // Orçamentos pendentes
    const { count: orcCount } = await supabase.from('orcamentos').select('*', { count: 'exact', head: true })
      .eq('status', 'Pendente')
    setOrcamentosPendentes(orcCount || 0)

    // Próximas sessões (a partir de hoje)
    const { data: sessoes } = await supabase.from('sessoes').select('*')
      .gte('data', hoje).order('data', { ascending: true }).limit(4)
    setProximasSessoes(sessoes || [])

    setLoading(false)
  }

  const stats = [
    { label: 'Total de clientes', value: totalClientes.toString(), color: '#7c6af7' },
    { label: 'Sessões este mês', value: sessoesDoMes.toString(), color: '#34d399' },
    { label: 'Receita do mês', value: fmt(receitaMes), color: '#a78bfa' },
    { label: 'Orçamentos pendentes', value: orcamentosPendentes.toString(), color: '#f87171' },
  ]

  const tipoColors: Record<string, string> = {
    'Casamento': '#7c6af7', 'Ensaio': '#3b82f6', 'Newborn': '#f472b6',
    'Aniversário': '#fbbf24', 'Corporativo': '#34d399', 'Outro': '#94a3b8',
  }

  // Formata nome do usuário
  const firstName = userName.charAt(0).toUpperCase() + userName.slice(1)

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#f8f8ff' }}>
              Olá, {loading ? '...' : firstName}! 👋
            </h2>
            <p style={{ color: '#8b8b9e' }}>Bem-vindo ao seu painel de controle</p>
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <span className="text-sm px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(124,106,247,0.15)', color: '#a78bfa' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="p-6 rounded-xl border" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
              <p className="text-sm mb-2" style={{ color: '#8b8b9e' }}>{stat.label}</p>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>
                {loading ? '...' : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Próximas sessões */}
        <div className="p-6 rounded-xl border mb-6" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{ color: '#f8f8ff' }}>Próximas Sessões</h3>
            <a href="/dashboard/agenda" className="text-sm hover:opacity-80" style={{ color: '#a78bfa' }}>Ver agenda →</a>
          </div>
          {loading ? (
            <p style={{ color: '#8b8b9e' }}>Carregando...</p>
          ) : proximasSessoes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg mb-2" style={{ color: '#f8f8ff' }}>Nenhuma sessão agendada</p>
              <a href="/dashboard/agenda" className="text-sm hover:opacity-80" style={{ color: '#7c6af7' }}>Agendar sessão →</a>
            </div>
          ) : (
            <div className="space-y-4">
              {proximasSessoes.map((session, i) => (
                <div key={i} className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: tipoColors[session.tipo] || '#7c6af7' }}>📷</div>
                    <div>
                      <p className="font-semibold" style={{ color: '#f8f8ff' }}>{session.cliente_nome}</p>
                      <p className="text-sm" style={{ color: '#8b8b9e' }}>{session.tipo}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1">
                    <p className="text-sm" style={{ color: '#a78bfa' }}>
                      {new Date(session.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} às {fmtHora(session.horario_inicio)}
                    </p>
                    <p className="text-sm" style={{ color: '#8b8b9e' }}>{session.local}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Atalhos rápidos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Novo Cliente', icon: '👥', href: '/dashboard/clientes', color: '#7c6af7' },
            { label: 'Nova Sessão', icon: '📅', href: '/dashboard/agenda', color: '#34d399' },
            { label: 'Novo Orçamento', icon: '💰', href: '/dashboard/orcamentos', color: '#fbbf24' },
            { label: 'Ver Contratos', icon: '📄', href: '/dashboard/contratos', color: '#a78bfa' },
          ].map((item, i) => (
            <a key={i} href={item.href}
              className="p-4 rounded-xl border flex items-center gap-3 hover:opacity-80 transition-all"
              style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: `${item.color}20` }}>{item.icon}</div>
              <span className="text-sm font-medium" style={{ color: '#f8f8ff' }}>{item.label}</span>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}