'use client'

import { useState } from 'react'
import Sidebar from '@/app/components/Sidebar'

interface Contract {
  id: number; cliente: string; tipo: string; valor: number; dataEnvio: string;
  status: 'Rascunho' | 'Aguardando' | 'Assinado' | 'Expirado'
}

const columns = [
  { id: 'Rascunho', title: 'Rascunho', color: '#94a3b8' },
  { id: 'Aguardando', title: 'Aguardando Assinatura', color: '#fbbf24' },
  { id: 'Assinado', title: 'Assinado', color: '#34d399' },
  { id: 'Expirado', title: 'Expirado', color: '#ef4444' },
]

export default function Contratos() {
  const [modalOpen, setModalOpen] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([
    { id: 1, cliente: 'Maria Silva', tipo: 'Casamento', valor: 8500, dataEnvio: '2026-05-20', status: 'Assinado' },
    { id: 2, cliente: 'João Santos', tipo: 'Corporativo', valor: 3200, dataEnvio: '2026-05-25', status: 'Aguardando' },
    { id: 3, cliente: 'Ana Costa', tipo: 'Aniversário', valor: 1800, dataEnvio: '2026-05-28', status: 'Aguardando' },
    { id: 4, cliente: 'Pedro Lima', tipo: 'Newborn', valor: 1200, dataEnvio: '2026-05-15', status: 'Expirado' },
    { id: 5, cliente: 'Carla Oliveira', tipo: 'Ensaio', valor: 950, dataEnvio: '2026-05-10', status: 'Rascunho' },
    { id: 6, cliente: 'Lucas Ferreira', tipo: 'Casamento', valor: 12000, dataEnvio: '2026-05-30', status: 'Rascunho' },
  ])
  const [newContract, setNewContract] = useState({ cliente: '', tipo: 'Casamento', dataSessao: '', valorTotal: '', sinal: '', clausulas: '' })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setContracts([...contracts, { id: contracts.length + 1, cliente: newContract.cliente, tipo: newContract.tipo, valor: parseFloat(newContract.valorTotal), dataEnvio: new Date().toISOString().split('T')[0], status: 'Rascunho' }])
    setModalOpen(false)
    setNewContract({ cliente: '', tipo: 'Casamento', dataSessao: '', valorTotal: '', sinal: '', clausulas: '' })
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')
  const getInitials = (n: string) => n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0f' }}>
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#f8f8ff' }}>Contratos</h2>
            <p style={{ color: '#8b8b9e' }}>Gerencie seus contratos</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="px-6 py-2 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>Novo Contrato</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(col => {
            const colContracts = contracts.filter(c => c.status === col.id)
            return (
              <div key={col.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#13131a', border: '1px solid #1e1e2e' }}>
                <div className="p-4 flex items-center justify-between" style={{ backgroundColor: `${col.color}20` }}>
                  <h3 className="font-semibold" style={{ color: col.color }}>{col.title}</h3>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: col.color, color: '#0a0a0f' }}>{colContracts.length}</span>
                </div>
                <div className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
                  {colContracts.map(c => (
                    <div key={c.id} className="p-4 rounded-lg border hover:scale-105 transition-all" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e' }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>{getInitials(c.cliente)}</div>
                        <div>
                          <h4 className="font-bold text-sm truncate" style={{ color: '#f8f8ff' }}>{c.cliente}</h4>
                          <p className="text-xs" style={{ color: '#8b8b9e' }}>{c.tipo}</p>
                        </div>
                      </div>
                      <p className="font-bold text-lg mb-2" style={{ color: '#a78bfa' }}>{fmt(c.valor)}</p>
                      <p className="text-xs mb-3" style={{ color: '#8b8b9e' }}>Enviado em {fmtDate(c.dataEnvio)}</p>
                      <div className="flex gap-2">
                        <button className="flex-1 px-2 py-1 rounded text-xs font-semibold hover:opacity-80" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>Ver</button>
                        <button onClick={() => alert(`PDF do contrato de ${c.cliente}`)} className="flex-1 px-2 py-1 rounded text-xs font-semibold hover:opacity-80" style={{ backgroundColor: 'rgba(52,211,153,0.2)', color: '#34d399' }}>PDF</button>
                      </div>
                    </div>
                  ))}
                  {colContracts.length === 0 && <p className="p-4 text-center text-sm" style={{ color: '#8b8b9e' }}>Nenhum contrato</p>}
                </div>
              </div>
            )
          })}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#13131a' }}>
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
                  <select value={newContract.tipo} onChange={e => setNewContract({ ...newContract, tipo: e.target.value })} className="w-full px-4 py-3 rounded-lg border focus:outline-none" style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
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