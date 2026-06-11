'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type Stats = { total: number; draft: number; sent: number; paid: number; overdue: number; revenue: number; pending: number }

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', stage1_paid: 'Stage 1', stage2_paid: 'Stage 2', paid: 'Paid', overdue: 'Overdue'
}
const STATUS_CLASS: Record<string, string> = {
  draft: 'badge-draft', sent: 'badge-sent', stage1_paid: 'badge-partial',
  stage2_paid: 'badge-partial', paid: 'badge-paid', overdue: 'badge-overdue'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, draft: 0, sent: 0, paid: 0, overdue: 0, revenue: 0, pending: 0 })
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: invoices } = await supabase.from('invoices').select('id,pi_number,client_name,total,status,date,type').order('created_at', { ascending: false })
      if (!invoices) return setLoading(false)

      const s: Stats = { total: invoices.length, draft: 0, sent: 0, paid: 0, overdue: 0, revenue: 0, pending: 0 }
      invoices.forEach(inv => {
        if (inv.status === 'draft') s.draft++
        else if (inv.status === 'sent') { s.sent++; s.pending += inv.total }
        else if (inv.status === 'paid') { s.paid++; s.revenue += inv.total }
        else if (inv.status === 'overdue') { s.overdue++; s.pending += inv.total }
        else if (['stage1_paid', 'stage2_paid'].includes(inv.status)) { s.pending += inv.total * 0.5 }
      })
      setStats(s)
      setRecent(invoices.slice(0, 8))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <AppShell title="Dashboard" actions={
      <Link href="/new-invoice" className="btn btn-primary btn-sm">＋ New Invoice</Link>
    }>
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card accent-red">
          <div className="stat-label">Total Invoices</div>
          <div className="stat-value font-serif">{stats.total}</div>
          <div className="stat-sub">{stats.draft} draft · {stats.sent} sent</div>
        </div>
        <div className="stat-card accent-green">
          <div className="stat-label">Revenue Collected</div>
          <div className="stat-value font-serif">{loading ? '—' : fmt(stats.revenue)}</div>
          <div className="stat-sub">{stats.paid} invoices paid</div>
        </div>
        <div className="stat-card accent-amber">
          <div className="stat-label">Pending Amount</div>
          <div className="stat-value font-serif">{loading ? '—' : fmt(stats.pending)}</div>
          <div className="stat-sub">{stats.sent} awaiting payment</div>
        </div>
        <div className="stat-card accent-blue">
          <div className="stat-label">Overdue</div>
          <div className="stat-value font-serif" style={{ color: stats.overdue > 0 ? 'var(--red-dk)' : undefined }}>{stats.overdue}</div>
          <div className="stat-sub">Requires follow-up</div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Recent Invoices</span>
          <Link href="/invoices" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◧</div>
            <h3>No invoices yet</h3>
            <p>Create your first invoice to get started.</p>
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
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600, fontFamily: '"EB Garamond", serif', fontSize: 14 }}>{inv.pi_number}</td>
                    <td>{inv.client_name}</td>
                    <td><span className="badge badge-type" style={{ textTransform: 'capitalize' }}>{inv.type}</span></td>
                    <td className="text-muted">{fmtDate(inv.date)}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(inv.total)}</td>
                    <td>
                      <span className={`badge ${STATUS_CLASS[inv.status] || 'badge-draft'}`}>
                        <span className="badge-dot" />
                        {STATUS_LABELS[inv.status] || inv.status}
                      </span>
                    </td>
                    <td>
                      <Link href={`/invoices/${inv.id}`} className="btn btn-ghost btn-sm">View</Link>
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
