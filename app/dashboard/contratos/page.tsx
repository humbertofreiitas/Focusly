'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import { createClient } from '@/utils/supabase/client'

interface Contract {
  id: string
  cliente: string
  tipo: string
  valor: number
  sinal: number
  data_envio: string
  data_sessao: string
  status: 'Rascunho' | 'Aguardando' | 'Assinado' | 'Expirado'
  clausulas: string
}

const columns = [
  { id: 'Rascunho', title: 'Rascunho', color: '#94a3b8' },
  { id: 'Aguardando', title: 'Aguardando Assinatura', color: '#fbbf24' },
  { id: 'Assinado', title: 'Assinado', color: '#34d399' },
  { id: 'Expirado', title: 'Expirado', color: '#ef4444' },
]

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
const fmtDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-'
const getInitials = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)

export default function Contratos() {
  const [modalOpen, setModalOpen] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newContract, setNewContract] = useState({ cliente: '', tipo: 'Casamento', dataSessao: '', valorTotal: '', sinal: '', clausulas: '' })
  const supabase = createClient()

  useEffect(() => { loadContracts() }, [])

  const loadContracts = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('contratos').select('*').order('created_at', { ascending: false })
    if (!error && data) setContracts(data)
    setLoading(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from('contratos').insert([{
        cliente: newContract.cliente,
        tipo: newContract.tipo,
        valor: parseFloat(newContract.valorTotal),
        sinal: parseFloat(newContract.sinal) || 0,
        data_sessao: newContract.dataSessao || null,
        clausulas: newContract.clausulas,
        status: 'Rascunho',
        user_id: user.id,
      }]).select().single()

      if (!error && data) {
        setContracts([data, ...contracts])
        setModalOpen(false)
        setNewContract({ cliente: '', tipo: 'Casamento', dataSessao: '', valorTotal: '', sinal: '', clausulas: '' })
      }
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleStatusChange = async (id: string, newStatus: Contract['status']) => {
    const { error } = await supabase.from('contratos').update({ status: newStatus }).eq('id', id)
    if (error) return

    setContracts(contracts.map(c => c.id === id ? { ...c, status: newStatus } : c))

    if (newStatus === 'Assinado') {
      const contrato = contracts.find(c => c.id === id)
      if (!contrato) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Cria entrega automaticamente
      const { data: existingEntrega } = await supabase.from('entregas')
        .select('id').eq('cliente', contrato.cliente).eq('tipo', contrato.tipo)

      if (!existingEntrega || existingEntrega.length === 0) {
        await supabase.from('entregas').insert([{
          cliente: contrato.cliente,
          tipo: contrato.tipo,
          total_fotos: 0,
          editadas: 0,
          prazo: contrato.data_sessao || null,
          status: 'Em edição',
          user_id: user.id,
        }])
      }

      // Cria sessão na agenda automaticamente (se tiver data da sessão)
      if (contrato.data_sessao) {
        const { data: existingSessao } = await supabase.from('sessoes')
          .select('id').eq('cliente_nome', contrato.cliente).eq('data', contrato.data_sessao)

        if (!existingSessao || existingSessao.length === 0) {
          await supabase.from('sessoes').insert([{
            cliente_nome: contrato.cliente,
            tipo: contrato.tipo,
            data: contrato.data_sessao,
            horario_inicio: '09:00',
            horario_fim: '11:00',
            local: '',
            status: 'Agendado',
            observacoes: `Criado automaticamente do contrato`,
            user_id: user.id,
          }])
        }
      }
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('contratos').delete().eq('id', id)
    if (!error) setContracts(contracts.filter(c => c.id !== id))
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#f8f8ff' }}>Contratos</h2>
            <p style={{ color: '#8b8b9e' }}>Gerencie seus contratos</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="px-6 py-2 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>
            Novo Contrato
          </button>
        </header>

        {loading ? (
          <div className="text-center py-12" style={{ color: '#8b8b9e' }}>Carregando contratos...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map(col => {
              const colContracts = contracts.filter(c => c.status === col.id)
              return (
                <div key={col.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#13131a', border: '1px solid #1e1e2e' }}>
                  <div className="p-4 flex items-center justify-between" style={{ backgroundColor: `${col.color}20` }}>
                    <h3 className="font-semibold text-sm" style={{ color: col.color }}>{col.title}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: col.color, color: '#0a0a0f' }}>{colContracts.length}</span>
                  </div>
                  <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                    {colContracts.map(c => (
                      <div key={c.id} className="p-4 rounded-lg border transition-all hover:scale-105" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e' }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>
                            {getInitials(c.cliente)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm truncate" style={{ color: '#f8f8ff' }}>{c.cliente}</h4>
                            <p className="text-xs" style={{ color: '#8b8b9e' }}>{c.tipo}</p>
                          </div>
                        </div>

                        <p className="font-bold text-lg mb-1" style={{ color: '#a78bfa' }}>{fmt(c.valor)}</p>
                        {c.sinal > 0 && <p className="text-xs mb-2" style={{ color: '#8b8b9e' }}>Sinal: {fmt(c.sinal)}</p>}
                        <p className="text-xs mb-3" style={{ color: '#8b8b9e' }}>
                          {c.data_sessao ? `Sessão: ${fmtDate(c.data_sessao)}` : `Criado: ${fmtDate(c.data_envio)}`}
                        </p>

                        <div className="mb-3">
                          <select
                            value={c.status}
                            onChange={e => handleStatusChange(c.id, e.target.value as Contract['status'])}
                            className="w-full px-2 py-1 rounded text-xs border focus:outline-none"
                            style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e', color: '#f8f8ff' }}
                          >
                            {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <button className="flex-1 px-2 py-1 rounded text-xs font-semibold hover:opacity-80" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>Ver</button>
                          <button onClick={() => handleDelete(c.id)} className="flex-1 px-2 py-1 rounded text-xs font-semibold hover:opacity-80" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>Excluir</button>
                        </div>
                      </div>
                    ))}
                    {colContracts.length === 0 && (
                      <p className="p-4 text-center text-sm" style={{ color: '#8b8b9e' }}>Nenhum contrato</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-xl p-6" style={{ backgroundColor: '#13131a', maxHeight: '90vh', overflowY: 'auto', scrollbarWidth: 'none' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#f8f8ff' }}>Novo Contrato</h3>
                <button onClick={() => setModalOpen(false)} className="text-2xl hover:opacity-80" style={{ color: '#8b8b9e' }}>×</button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Cliente</label>
                  <input type="text" required value={newContract.cliente} onChange={e => setNewContract({ ...newContract, cliente: e.target.value })} placeholder="Nome do cliente"
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Tipo de sessão</label>
                  <select value={newContract.tipo} onChange={e => setNewContract({ ...newContract, tipo: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                    {['Casamento', 'Ensaio', 'Newborn', 'Aniversário', 'Corporativo', 'Outro'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Data da sessão</label>
                  <input type="date" value={newContract.dataSessao} onChange={e => setNewContract({ ...newContract, dataSessao: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Valor total (R$)</label>
                    <input type="number" required step="0.01" value={newContract.valorTotal} onChange={e => setNewContract({ ...newContract, valorTotal: e.target.value })} placeholder="0,00"
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Sinal (R$)</label>
                    <input type="number" step="0.01" value={newContract.sinal} onChange={e => setNewContract({ ...newContract, sinal: e.target.value })} placeholder="0,00"
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Cláusulas especiais</label>
                  <textarea value={newContract.clausulas} onChange={e => setNewContract({ ...newContract, clausulas: e.target.value })} rows={4} placeholder="Adicione cláusulas especiais..."
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none resize-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
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