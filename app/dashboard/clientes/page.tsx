'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import { createClient } from '@/utils/supabase/client'

interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  whatsapp: string
  tipo: string
  status: string
  observacoes: string
}

export default function Clientes() {
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newClient, setNewClient] = useState({ nome: '', email: '', telefone: '', whatsapp: '', tipo: 'Casamento', observacoes: '' })
  const supabase = createClient()

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setClients(data)
    setLoading(false)
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('clientes')
      .insert([{ ...newClient, user_id: user.id, status: 'Ativo' }])
      .select()
      .single()

    if (!error && data) {
      setClients([data, ...clients])
      setModalOpen(false)
      setNewClient({ nome: '', email: '', telefone: '', whatsapp: '', tipo: 'Casamento', observacoes: '' })
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (!error) setClients(clients.filter(c => c.id !== id))
  }

  const filteredClients = clients.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()))

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
          {loading ? (
            <div className="p-12 text-center" style={{ color: '#8b8b9e' }}>Carregando clientes...</div>
          ) : filteredClients.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-lg font-semibold mb-2" style={{ color: '#f8f8ff' }}>Nenhum cliente ainda</p>
              <p style={{ color: '#8b8b9e' }}>Clique em "Novo Cliente" para adicionar seu primeiro cliente</p>
            </div>
          ) : (
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
                          <button onClick={() => handleDelete(client.id)} className="px-3 py-1 rounded text-sm hover:opacity-80" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
                  { label: 'Telefone', key: 'telefone', type: 'tel', placeholder: '(34) 98765-4321' },
                  { label: 'WhatsApp', key: 'whatsapp', type: 'tel', placeholder: '(34) 98765-4321' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#f8f8ff' }}>{f.label}</label>
                    <input type={f.type} required={f.key !== 'whatsapp' && f.key !== 'email'} placeholder={f.placeholder}
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