'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

function fmt(n: number) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('name')
    setClients(data || [])
    setLoading(false)
  }

  async function saveClient() {
    if (!name) return
    setSaving(true)
    await supabase.from('clients').insert({ name, email, phone, country, address, notes })
    setName(''); setEmail(''); setPhone(''); setCountry(''); setAddress(''); setNotes('')
    setShowForm(false)
    setSaving(false)
    loadClients()
  }

  async function deleteClient(id: string) {
    if (!confirm('Remove this client?')) return
    await supabase.from('clients').delete().eq('id', id)
    setClients(p => p.filter(c => c.id !== id))
  }

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.country?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppShell title="Clients" actions={
      <button className="btn btn-primary btn-sm" onClick={() => setShowForm(p => !p)}>
        {showForm ? '✕ Cancel' : '＋ Add Client'}
      </button>
    }>
      {/* Add client form */}
      {showForm && (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: 14, paddingBottom: 8, borderBottom: '1.5px solid var(--red-lt)' }}>New Client</div>
          <div className="f2">
            <div className="f"><label>Name *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Brand or company name" autoFocus /></div>
            <div className="f"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          </div>
          <div className="f2">
            <div className="f"><label>Phone</label><input value={phone} onChange={e=>setPhone(e.target.value)} /></div>
            <div className="f"><label>Country</label><input value={country} onChange={e=>setCountry(e.target.value)} /></div>
          </div>
          <div className="f"><label>Address</label><textarea value={address} onChange={e=>setAddress(e.target.value)} rows={2} /></div>
          <div className="f"><label>Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Any notes about this client…" /></div>
          <button className="btn btn-primary btn-sm" onClick={saveClient} disabled={saving || !name}>
            {saving ? 'Saving…' : 'Add Client'}
          </button>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 14 }}>
        <input type="text" placeholder="Search clients…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ width: '100%', maxWidth: 340, background: 'var(--paper)', border: '1.5px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '9px 12px', fontSize: 13, fontFamily: '"DM Sans",sans-serif', outline: 'none', color: 'var(--ink)' }} />
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◎</div>
            <h3>{search ? 'No clients match' : 'No clients yet'}</h3>
            <p>{search ? 'Try a different search.' : 'Add your first client using the button above.'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Country</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ color: 'var(--muted)' }}>{c.email || '—'}</td>
                    <td style={{ color: 'var(--muted)' }}>{c.phone || '—'}</td>
                    <td>{c.country || '—'}</td>
                    <td style={{ color: 'var(--muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notes || '—'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteClient(c.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
