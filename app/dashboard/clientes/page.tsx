'use client'

import { useState } from 'react'
import Sidebar from '@/app/components/Sidebar'

export default function Clientes() {
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [clients, setClients] = useState([
    { id: 1, nome: 'Maria Silva', email: 'maria@email.com', telefone: '(11) 98765-4321', tipo: 'Casamento', status: 'Ativo' },
    { id: 2, nome: 'João Santos', email: 'joao@email.com', telefone: '(11) 91234-5678', tipo: 'Corporativo', status: 'Ativo' },
    { id: 3, nome: 'Ana Costa', email: 'ana@email.com', telefone: '(11) 94567-8901', tipo: 'Aniversário', status: 'Pendente' },
    { id: 4, nome: 'Pedro Lima', email: 'pedro@email.com', telefone: '(11) 98901-2345', tipo: 'Newborn', status: 'Ativo' },
    { id: 5, nome: 'Carla Oliveira', email: 'carla@email.com', telefone: '(11) 92345-6789', tipo: 'Ensaio', status: 'Concluído' },
  ])

  const [newClient, setNewClient] = useState({ nome: '', email: '', telefone: '', whatsapp: '', tipo: 'Casamento', observacoes: '' })

  const filteredClients = clients.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault()
    setClients([...clients, { id: clients.length + 1, ...newClient, status: 'Ativo' }])
    setModalOpen(false)
    setNewClient({ nome: '', email: '', telefone: '', whatsapp: '', tipo: 'Casamento', observacoes: '' })
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0a0a0f' }}>
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#f8f8ff' }}>Clientes</h2>
            <p style={{ color: '#8b8b9e' }}>Gerencie seus clientes</p>
          </div>
          <button onClick={() => setModalOpen(true)} className="px-6 py-2 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>
            Novo Cliente
          </button>
        </header>

        <div className="mb-6">
          <input type="text" placeholder="Buscar cliente por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border focus:outline-none transition-all"
            style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: '#13131a', borderColor: '#1e1e2e' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                  {['Nome', 'Email', 'Telefone', 'Tipo de sessão', 'Status', 'Ações'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#f8f8ff' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => (
                  <tr key={client.id} style={{ borderBottom: '1px solid #1e1e2e' }}>
                    <td className="px-6 py-4 font-medium" style={{ color: '#f8f8ff' }}>{client.nome}</td>
                    <td className="px-6 py-4" style={{ color: '#8b8b9e' }}>{client.email}</td>
                    <td className="px-6 py-4" style={{ color: '#8b8b9e' }}>{client.telefone}</td>
                    <td className="px-6 py-4" style={{ color: '#8b8b9e' }}>{client.tipo}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{
                        backgroundColor: client.status === 'Ativo' ? 'rgba(52,211,153,0.2)' : client.status === 'Pendente' ? 'rgba(251,191,36,0.2)' : 'rgba(148,163,184,0.2)',
                        color: client.status === 'Ativo' ? '#34d399' : client.status === 'Pendente' ? '#fbbf24' : '#94a3b8',
                      }}>{client.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="px-3 py-1 rounded text-sm hover:opacity-80" style={{ backgroundColor: '#7c6af7', color: '#f8f8ff' }}>Ver</button>
                        <button className="px-3 py-1 rounded text-sm hover:opacity-80" style={{ backgroundColor: '#a78bfa', color: '#f8f8ff' }}>Editar</button>
                        <button onClick={() => setClients(clients.filter(c => c.id !== client.id))} className="px-3 py-1 rounded text-sm hover:opacity-80" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#13131a' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#f8f8ff' }}>Novo Cliente</h3>
                <button onClick={() => setModalOpen(false)} className="text-2xl hover:opacity-80" style={{ color: '#8b8b9e' }}>×</button>
              </div>
              <form onSubmit={handleAddClient} className="space-y-4">
                {[
                  { label: 'Nome completo', key: 'nome', type: 'text', placeholder: 'Nome do cliente' },
                  { label: 'Email', key: 'email', type: 'email', placeholder: 'email@exemplo.com' },
                  { label: 'Telefone', key: 'telefone', type: 'tel', placeholder: '(11) 98765-4321' },
                  { label: 'WhatsApp', key: 'whatsapp', type: 'tel', placeholder: '(11) 98765-4321' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>{f.label}</label>
                    <input type={f.type} required={f.key !== 'whatsapp'} placeholder={f.placeholder}
                      value={(newClient as Record<string, string>)[f.key]}
                      onChange={e => setNewClient({ ...newClient, [f.key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border focus:outline-none"
                      style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }} />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Tipo de sessão</label>
                  <select value={newClient.tipo} onChange={e => setNewClient({ ...newClient, tipo: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none"
                    style={{ backgroundColor: '#0a0a0f', borderColor: '#1e1e2e', color: '#f8f8ff' }}>
                    {['Casamento', 'Ensaio', 'Newborn', 'Aniversário', 'Corporativo', 'Outro'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>Observações</label>
                  <textarea value={newClient.observacoes} onChange={e => setNewClient({ ...newClient, observacoes: e.target.value })}
                    rows={3} placeholder="Observações adicionais..."
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