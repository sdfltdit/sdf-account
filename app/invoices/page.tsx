'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', stage1_paid: 'Stage 1 Paid',
  stage2_paid: 'Stage 2 Paid', paid: 'Paid', overdue: 'Overdue'
}
const STATUS_CLASS: Record<string, string> = {
  draft: 'badge-draft', sent: 'badge-sent', stage1_paid: 'badge-partial',
  stage2_paid: 'badge-partial', paid: 'badge-paid', overdue: 'badge-overdue'
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    supabase.from('invoices')
      .select('id,pi_number,client_name,client_email,total,status,date,due_date,type')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setInvoices(data || []); setLoading(false) })
  }, [])

  async function updateStatus(id: string, status: string) {
    await supabase.from('invoices').update({ status }).eq('id', id)
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv))
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    await supabase.from('invoices').delete().eq('id', id)
    setInvoices(prev => prev.filter(inv => inv.id !== id))
  }

  const filtered = invoices.filter(inv => {
    const matchSearch = !search || inv.pi_number.toLowerCase().includes(search.toLowerCase()) || inv.client_name.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || inv.type === typeFilter
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchSearch && matchType && matchStatus
  })

  return (
    <AppShell title="Invoices" actions={
      <Link href="/new-invoice" className="btn btn-primary btn-sm">＋ New Invoice</Link>
    }>
      {/* Filters */}
      <div className="card card-pad" style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text" placeholder="Search PI number or client…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, background: 'var(--field)', border: '1.5px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '9px 12px', fontSize: 13, fontFamily: '"DM Sans",sans-serif', outline: 'none', color: 'var(--ink)' }}
        />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ background: 'var(--field)', border: '1.5px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '9px 12px', fontSize: 13, fontFamily: '"DM Sans",sans-serif', color: 'var(--ink)', cursor: 'pointer' }}>
          <option value="all">All Types</option>
          <option value="sample">Sample</option>
          <option value="correction">Correction</option>
          <option value="bulk">Bulk</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ background: 'var(--field)', border: '1.5px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '9px 12px', fontSize: 13, fontFamily: '"DM Sans",sans-serif', color: 'var(--ink)', cursor: 'pointer' }}>
          <option value="all">All Status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading invoices…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◧</div>
            <h3>No invoices found</h3>
            <p>Try adjusting your filters or create a new invoice.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PI Number</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, fontFamily: '"EB Garamond",serif', fontSize: 14 }}>{inv.pi_number}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{inv.client_name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{inv.client_email}</div>
                    </td>
                    <td><span className="badge badge-type" style={{ textTransform: 'capitalize' }}>{inv.type}</span></td>
                    <td className="text-muted">{fmtDate(inv.date)}</td>
                    <td className="text-muted">{fmtDate(inv.due_date)}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(inv.total)}</td>
                    <td>
                      <select
                        value={inv.status}
                        onChange={e => updateStatus(inv.id, e.target.value)}
                        className={`badge ${STATUS_CLASS[inv.status] || 'badge-draft'}`}
                        style={{ border: 'none', cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', fontSize: 11, padding: '3px 6px', borderRadius: 99 }}
                      >
                        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/invoices/${inv.id}`} className="btn btn-ghost btn-sm">View</Link>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => deleteInvoice(inv.id)}>✕</button>
                      </div>
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
