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

interface Pagamento {
  id: string
  contrato_id: string
  descricao: string
  valor: number
  data: string
  status: string
  tipo: string
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
  const [pagamentoModal, setPagamentoModal] = useState<Contract | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newContract, setNewContract] = useState({ cliente: '', tipo: 'Casamento', dataSessao: '', valorTotal: '', sinal: '', clausulas: '' })
  const [newPagamento, setNewPagamento] = useState({ descricao: '', valor: '', data: '', tipo: 'Parcela', status: 'Pago' })
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [{ data: contratosData }, { data: pagamentosData }] = await Promise.all([
      supabase.from('contratos').select('*').order('created_at', { ascending: false }),
      supabase.from('pagamentos').select('*').order('data', { ascending: true }),
    ])
    if (contratosData) setContracts(contratosData)
    if (pagamentosData) setPagamentos(pagamentosData)
    setLoading(false)
  }

  const getPagamentosContrato = (contratoId: string) => pagamentos.filter(p => p.contrato_id === contratoId)

  const getTotalPago = (contratoId: string) => getPagamentosContrato(contratoId)
    .filter(p => p.status === 'Pago').reduce((s, p) => s + p.valor, 0)

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
        // Se tiver sinal, cria pagamento de sinal automaticamente
        if (newContract.sinal && parseFloat(newContract.sinal) > 0) {
          await supabase.from('pagamentos').insert([{
            contrato_id: data.id,
            descricao: `Sinal - ${newContract.cliente}`,
            valor: parseFloat(newContract.sinal),
            data: new Date().toISOString().split('T')[0],
            status: 'Pendente',
            tipo: 'Sinal',
            user_id: user.id,
          }])
          await loadData()
        } else {
          setContracts([data, ...contracts])
        }
        setModalOpen(false)
        setNewContract({ cliente: '', tipo: 'Casamento', dataSessao: '', valorTotal: '', sinal: '', clausulas: '' })
      }
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleAddPagamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pagamentoModal) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from('pagamentos').insert([{
        contrato_id: pagamentoModal.id,
        descricao: newPagamento.descricao || `${newPagamento.tipo} - ${pagamentoModal.cliente}`,
        valor: parseFloat(newPagamento.valor),
        data: newPagamento.data,
        status: newPagamento.status,
        tipo: newPagamento.tipo,
        user_id: user.id,
      }]).select().single()

      if (!error && data) {
        setPagamentos([...pagamentos, data])
        setNewPagamento({ descricao: '', valor: '', data: '', tipo: 'Parcela', status: 'Pago' })
      }
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  const handleDeletePagamento = async (id: string) => {
    const { error } = await supabase.from('pagamentos').delete().eq('id', id)
    if (!error) setPagamentos(pagamentos.filter(p => p.id !== id))
  }

  const handlePagamentoStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('pagamentos').update({ status }).eq('id', id)
    if (!error) setPagamentos(pagamentos.map(p => p.id === id ? { ...p, status } : p))
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

      const { data: existingEntrega } = await supabase.from('entregas').select('id').eq('cliente', contrato.cliente).eq('tipo', contrato.tipo)
      if (!existingEntrega || existingEntrega.length === 0) {
        await supabase.from('entregas').insert([{ cliente: contrato.cliente, tipo: contrato.tipo, total_fotos: 0, editadas: 0, prazo: contrato.data_sessao || null, status: 'Em edição', user_id: user.id }])
      }

      if (contrato.data_sessao) {
        const { data: existingSessao } = await supabase.from('sessoes').select('id').eq('cliente_nome', contrato.cliente).eq('data', contrato.data_sessao)
        if (!existingSessao || existingSessao.length === 0) {
          await supabase.from('sessoes').insert([{ cliente_nome: contrato.cliente, tipo: contrato.tipo, data: contrato.data_sessao, horario_inicio: '09:00', horario_fim: '11:00', local: '', status: 'Agendado', observacoes: 'Criado automaticamente do contrato', user_id: user.id }])
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
            <p style={{ color: '#8b8b9e' }}>Gerencie seus contratos e pagamentos</p>
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
                    {colContracts.map(c => {
                      const totalPago = getTotalPago(c.id)
                      const progresso = c.valor > 0 ? Math.round((totalPago / c.valor) * 100) : 0
                      const falta = c.valor - totalPago
                      return (
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

                          {/* Barra de pagamento */}
                          <div className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span style={{ color: '#34d399' }}>Pago: {fmt(totalPago)}</span>
                              <span style={{ color: falta > 0 ? '#fbbf24' : '#34d399' }}>
                                {falta > 0 ? `Falta: ${fmt(falta)}` : '✅ Quitado'}
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#1e1e2e' }}>
                              <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(progresso, 100)}%`, backgroundColor: progresso >= 100 ? '#34d399' : '#7c6af7' }} />
                            </div>
                          </div>

                          <p className="text-xs mb-3" style={{ color: '#8b8b9e' }}>
                            {c.data_sessao ? `Sessão: ${fmtDate(c.data_sessao)}` : `Criado: ${fmtDate(c.data_envio)}`}
                          </p>

                          <div className="mb-3">
                            <select value={c.status} onChange={e => handleStatusChange(c.id, e.target.value as Contract['status'])}
                              className="w-full px-2 py-1 rounded text-xs border focus:outline-none"
                              style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                              {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                            </select>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={() => setPagamentoModal(c)} className="flex-1 px-2 py-1 rounded text-xs font-semibold hover:opacity-80" style={{ backgroundColor: 'rgba(52,211,153,0.2)', color: '#34d399' }}>
                              💰 Pagamentos
                            </button>
                            <button onClick={() => handleDelete(c.id)} className="px-2 py-1 rounded text-xs font-semibold hover:opacity-80" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>🗑</button>
                          </div>
                        </div>
                      )
                    })}
                    {colContracts.length === 0 && <p className="p-4 text-center text-sm" style={{ color: '#8b8b9e' }}>Nenhum contrato</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal Novo Contrato */}
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
                <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: 'rgba(124,106,247,0.1)', color: '#a78bfa' }}>
                  💡 Se preencher o sinal, ele será criado como pagamento pendente automaticamente
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Cláusulas especiais</label>
                  <textarea value={newContract.clausulas} onChange={e => setNewContract({ ...newContract, clausulas: e.target.value })} rows={3} placeholder="Adicione cláusulas especiais..."
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

        {/* Modal Pagamentos */}
        {pagamentoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-xl p-6" style={{ backgroundColor: '#13131a', maxHeight: '90vh', overflowY: 'auto', scrollbarWidth: 'none' }}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold" style={{ color: '#f8f8ff' }}>Pagamentos</h3>
                <button onClick={() => setPagamentoModal(null)} className="text-2xl hover:opacity-80" style={{ color: '#8b8b9e' }}>×</button>
              </div>
              <p className="text-sm mb-1" style={{ color: '#8b8b9e' }}>{pagamentoModal.cliente} — {pagamentoModal.tipo}</p>
              <p className="text-lg font-bold mb-4" style={{ color: '#a78bfa' }}>Total: {fmt(pagamentoModal.valor)}</p>

              {/* Progresso */}
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#0a0a0f' }}>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: '#34d399' }}>Pago: {fmt(getTotalPago(pagamentoModal.id))}</span>
                  <span style={{ color: '#fbbf24' }}>Falta: {fmt(pagamentoModal.valor - getTotalPago(pagamentoModal.id))}</span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ backgroundColor: '#1e1e2e' }}>
                  <div className="h-3 rounded-full transition-all" style={{
                    width: `${Math.min((getTotalPago(pagamentoModal.id) / pagamentoModal.valor) * 100, 100)}%`,
                    backgroundColor: getTotalPago(pagamentoModal.id) >= pagamentoModal.valor ? '#34d399' : '#7c6af7'
                  }} />
                </div>
              </div>

              {/* Lista de pagamentos */}
              <div className="space-y-2 mb-6">
                {getPagamentosContrato(pagamentoModal.id).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#0a0a0f' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#f8f8ff' }}>{p.descricao}</p>
                      <p className="text-xs" style={{ color: '#8b8b9e' }}>{fmtDate(p.data)} • {p.tipo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: '#34d399' }}>{fmt(p.valor)}</span>
                      <select value={p.status} onChange={e => handlePagamentoStatus(p.id, e.target.value)}
                        className="px-2 py-1 rounded text-xs border focus:outline-none"
                        style={{ backgroundColor: p.status === 'Pago' ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)', borderColor: 'transparent', color: p.status === 'Pago' ? '#34d399' : '#fbbf24' }}>
                        <option value="Pago">Pago</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Atrasado">Atrasado</option>
                      </select>
                      <button onClick={() => handleDeletePagamento(p.id)} className="text-xs hover:opacity-80" style={{ color: '#ef4444' }}>✕</button>
                    </div>
                  </div>
                ))}
                {getPagamentosContrato(pagamentoModal.id).length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: '#8b8b9e' }}>Nenhum pagamento registrado</p>
                )}
              </div>

              {/* Adicionar pagamento */}
              <div className="border-t pt-4" style={{ borderColor: '#1e1e2e' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: '#f8f8ff' }}>Adicionar pagamento</p>
                <form onSubmit={handleAddPagamento} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <select value={newPagamento.tipo} onChange={e => setNewPagamento({ ...newPagamento, tipo: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                        style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                        <option>Sinal</option>
                        <option>Parcela</option>
                        <option>Restante</option>
                        <option>Avista</option>
                      </select>
                    </div>
                    <div>
                      <select value={newPagamento.status} onChange={e => setNewPagamento({ ...newPagamento, status: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                        style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                        <option>Pago</option>
                        <option>Pendente</option>
                        <option>Atrasado</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" required step="0.01" placeholder="Valor (R$)" value={newPagamento.valor}
                      onChange={e => setNewPagamento({ ...newPagamento, valor: e.target.value })}
                      className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                    <input type="date" required value={newPagamento.data}
                      onChange={e => setNewPagamento({ ...newPagamento, data: e.target.value })}
                      className="px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                  <input type="text" placeholder="Descrição (opcional)" value={newPagamento.descricao}
                    onChange={e => setNewPagamento({ ...newPagamento, descricao: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  <button type="submit" disabled={saving} className="w-full py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                    style={{ backgroundColor: '#7c6af7', color: '#f8f8ff', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Adicionando...' : '+ Adicionar Pagamento'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}