'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

function fmt(n: number) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }

const STAGE_MAP: Record<string, { label: string; pct: number; received: number }> = {
  draft:       { label: 'Not Sent',    pct: 0,   received: 0 },
  sent:        { label: 'Awaiting',    pct: 0,   received: 0 },
  stage1_paid: { label: 'Stage 1',     pct: 30,  received: 30 },
  stage2_paid: { label: 'Stage 2',     pct: 60,  received: 60 },
  paid:        { label: 'Fully Paid',  pct: 100, received: 100 },
  overdue:     { label: 'Overdue',     pct: 0,   received: 0 },
}

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    supabase.from('invoices')
      .select('id,pi_number,client_name,total,status,date,due_date,type')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setInvoices(data || []); setLoading(false) })
  }, [])

  async function updateStatus(id: string, status: string) {
    await supabase.from('invoices').update({ status }).eq('id', id)
    setInvoices(p => p.map(inv => inv.id === id ? { ...inv, status } : inv))
  }

  const filtered = invoices.filter(inv => {
    if (filter === 'pending') return ['sent','stage1_paid','stage2_paid'].includes(inv.status)
    if (filter === 'overdue') return inv.status === 'overdue'
    if (filter === 'paid') return inv.status === 'paid'
    return true
  })

  // Summary
  const totalRevenue = invoices.filter(i=>i.status==='paid').reduce((s,i)=>s+i.total,0)
  const totalPending = invoices.filter(i=>['sent','stage1_paid','stage2_paid'].includes(i.status)).reduce((s,i)=>s+i.total,0)
  const totalOverdue = invoices.filter(i=>i.status==='overdue').reduce((s,i)=>s+i.total,0)

  return (
    <AppShell title="Payments">
      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card accent-green">
          <div className="stat-label">Collected</div>
          <div className="stat-value font-serif">{fmt(totalRevenue)}</div>
          <div className="stat-sub">{invoices.filter(i=>i.status==='paid').length} invoices fully paid</div>
        </div>
        <div className="stat-card accent-amber">
          <div className="stat-label">Pending</div>
          <div className="stat-value font-serif">{fmt(totalPending)}</div>
          <div className="stat-sub">{invoices.filter(i=>['sent','stage1_paid','stage2_paid'].includes(i.status)).length} invoices in progress</div>
        </div>
        <div className="stat-card accent-red">
          <div className="stat-label">Overdue</div>
          <div className="stat-value font-serif" style={{ color: totalOverdue > 0 ? 'var(--red-dk)' : undefined }}>{fmt(totalOverdue)}</div>
          <div className="stat-sub">{invoices.filter(i=>i.status==='overdue').length} invoices overdue</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
        {[['all','All'],['pending','Pending'],['overdue','Overdue'],['paid','Paid']].map(([v,l]) => (
          <button key={v} onClick={()=>setFilter(v)}
            className={`btn btn-sm ${filter===v ? 'btn-primary' : 'btn-ghost'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--muted)', fontSize:13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">◈</div><h3>No invoices here</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PI Number</th>
                  <th>Client</th>
                  <th>Invoice Total</th>
                  <th>Received</th>
                  <th>Outstanding</th>
                  <th>Due Date</th>
                  <th>Payment Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const sm = STAGE_MAP[inv.status] || STAGE_MAP.draft
                  const received = inv.total * sm.received / 100
                  const outstanding = inv.total - received
                  const isOverdue = inv.status !== 'paid' && inv.due_date && new Date(inv.due_date) < new Date()
                  return (
                    <tr key={inv.id}>
                      <td>
                        <Link href={`/invoices/${inv.id}`} style={{ fontWeight:600, fontFamily:'"EB Garamond",serif', fontSize:14, color:'var(--ink)', textDecoration:'none' }}>{inv.pi_number}</Link>
                      </td>
                      <td style={{ fontWeight:500 }}>{inv.client_name}</td>
                      <td style={{ fontWeight:600 }}>{fmt(inv.total)}</td>
                      <td style={{ color:'var(--green)', fontWeight:500 }}>{fmt(received)}</td>
                      <td style={{ color: outstanding > 0 ? (isOverdue ? 'var(--red-dk)' : 'var(--amber)') : 'var(--muted)', fontWeight: outstanding > 0 ? 600 : 400 }}>
                        {outstanding > 0 ? fmt(outstanding) : '—'}
                      </td>
                      <td style={{ color: isOverdue ? 'var(--red-dk)' : 'var(--muted)' }}>
                        {inv.due_date ? fmtDate(inv.due_date) : '—'}
                        {isOverdue && <span style={{ marginLeft:5, fontSize:10.5, background:'var(--red-lt)', color:'var(--red-dk)', padding:'1px 6px', borderRadius:99, fontWeight:600 }}>OVERDUE</span>}
                      </td>
                      <td>
                        {/* Progress bar */}
                        <div style={{ width:100 }}>
                          <div style={{ fontSize:10.5, color:'var(--muted)', marginBottom:3 }}>{sm.label} · {sm.received}%</div>
                          <div style={{ height:5, background:'var(--line)', borderRadius:99, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${sm.received}%`, background: sm.received===100 ? 'var(--green)' : 'var(--red)', borderRadius:99, transition:'width .3s' }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <select value={inv.status} onChange={e=>updateStatus(inv.id,e.target.value)}
                          style={{ background:'var(--field)', border:'1.5px solid var(--line)', borderRadius:'var(--r-sm)', padding:'6px 8px', fontSize:11.5, fontFamily:'"DM Sans",sans-serif', color:'var(--ink)', cursor:'pointer' }}>
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="stage1_paid">Stage 1 Paid</option>
                          <option value="stage2_paid">Stage 2 Paid</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
