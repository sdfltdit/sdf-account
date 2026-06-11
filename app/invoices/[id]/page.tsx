'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

function fmt(n: number) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', sent: 'Sent', stage1_paid: 'Stage 1 Paid',
  stage2_paid: 'Stage 2 Paid', paid: 'Paid', overdue: 'Overdue'
}
const STATUS_CLASS: Record<string, string> = {
  draft: 'badge-draft', sent: 'badge-sent', stage1_paid: 'badge-partial',
  stage2_paid: 'badge-partial', paid: 'badge-paid', overdue: 'badge-overdue'
}

export default function InvoiceDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [inv, setInv] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('invoices').select('*').eq('id', id).single()
      .then(({ data }) => { setInv(data); setLoading(false) })
  }, [id])

  async function updateStatus(status: string) {
    setSaving(true)
    await supabase.from('invoices').update({ status }).eq('id', id)
    setInv((p: any) => ({ ...p, status }))
    setSaving(false)
  }

  async function deleteInvoice() {
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    await supabase.from('invoices').delete().eq('id', id)
    router.replace('/invoices')
  }

  if (loading) return (
    <AppShell title="Invoice">
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
    </AppShell>
  )
  if (!inv) return (
    <AppShell title="Invoice">
      <div className="empty-state"><h3>Invoice not found</h3><Link href="/invoices" className="btn btn-ghost" style={{ marginTop: 16 }}>← Back</Link></div>
    </AppShell>
  )

  const stage1 = inv.total * 0.30
  const stage2 = inv.total * 0.30
  const stage3 = inv.total * 0.40

  return (
    <AppShell title={inv.pi_number} actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={deleteInvoice}>Delete</button>
        <Link href="/invoices" className="btn btn-ghost btn-sm">← All Invoices</Link>
      </div>
    }>
      {/* Header row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="card card-pad" style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Invoice</div>
          <div style={{ fontFamily: '"EB Garamond",serif', fontSize: 26, fontWeight: 600, marginBottom: 4 }}>{inv.pi_number}</div>
          <span className="badge badge-type" style={{ textTransform: 'capitalize', marginBottom: 10 }}>{inv.type}</span>
          <div style={{ marginTop: 8 }}>
            <select
              value={inv.status}
              onChange={e => updateStatus(e.target.value)}
              disabled={saving}
              style={{ background: 'var(--field)', border: '1.5px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '8px 10px', fontSize: 12.5, fontFamily: '"DM Sans",sans-serif', color: 'var(--ink)', cursor: 'pointer', width: '100%' }}
            >
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="card card-pad" style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Client</div>
          <div style={{ fontWeight: 600, marginBottom: 3 }}>{inv.client_name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.7 }}>
            {inv.client_email}<br />
            {inv.client_country}
          </div>
        </div>

        <div className="card card-pad" style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Dates</div>
          <Row label="Invoice Date" value={fmtDate(inv.date)} />
          <Row label="Due Date" value={fmtDate(inv.due_date)} />
          <Row label="Est. Shipment" value={fmtDate(inv.ship_date)} />
          <Row label="PO Number" value={inv.po_number || '—'} />
        </div>

        <div className="card card-pad" style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Total</div>
          <div style={{ fontFamily: '"EB Garamond",serif', fontSize: 30, fontWeight: 600, color: 'var(--red-dk)', marginBottom: 6 }}>{fmt(inv.total)}</div>
          <Row label="Subtotal" value={fmt(inv.subtotal || inv.total)} />
          {inv.discount > 0 && <Row label="Discount" value={`-${fmt(inv.discount)}`} />}
          <Row label="Incoterm" value={inv.incoterm} />
        </div>
      </div>

      {/* Payment stages */}
      {inv.type === 'bulk' && (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: 14, paddingBottom: 8, borderBottom: '1.5px solid var(--red-lt)' }}>Payment Schedule</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[['Stage 1 — 30%', stage1, 'Production Deposit'], ['Stage 2 — 30%', stage2, 'Mid-Production'], ['Stage 3 — 40%', stage3, 'Final Balance']].map(([label, amt, sub]) => (
              <div key={label as string} style={{ background: 'var(--field)', borderRadius: 'var(--r-sm)', padding: '14px 16px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: '"EB Garamond",serif', fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>{fmt(amt as number)}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Line items */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--red)' }}>
          Line Items
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Code</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(inv.items || []).map((item: any, i: number) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.desc || '—'}</div>
                    {item.specs && (
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.6 }}>
                        {item.specs.color && `Colour: ${item.specs.color}`}
                        {item.specs.fabric && ` · Fabric: ${item.specs.fabric}`}
                        {item.specs.gsm && ` · ${item.specs.gsm} GSM`}
                      </div>
                    )}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.code || '—'}</td>
                  <td>{item.qty} pcs</td>
                  <td>{fmt(item.rate)}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(item.qty * item.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
              <span style={{ color: 'var(--muted)' }}>Subtotal</span><span>{fmt(inv.subtotal || inv.total)}</span>
            </div>
            {inv.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                <span style={{ color: 'var(--muted)' }}>Discount</span><span style={{ color: 'var(--green)' }}>-{fmt(inv.discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0 0', fontSize: 15, fontWeight: 700 }}>
              <span>Total</span><span style={{ color: 'var(--red-dk)' }}>{fmt(inv.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {inv.notes && (
        <div className="card card-pad">
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Notes</div>
          <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--ink2)' }}>{inv.notes}</p>
        </div>
      )}
    </AppShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12.5 }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}
