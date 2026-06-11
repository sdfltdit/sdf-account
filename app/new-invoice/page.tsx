'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type Item = { desc: string; code: string; qty: string; rate: string; specs?: { color: string; fabric: string; gsm: string; yarn: string; label: string; accessories: string } }

function genPI(type: string) {
  const prefix = type === 'sample' ? 'SPI' : type === 'correction' ? 'CPI' : 'BPI'
  const now = new Date()
  return `${prefix}-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(100+Math.random()*900)}`
}

const today = new Date().toISOString().split('T')[0]
const due30 = new Date(Date.now() + 30*864e5).toISOString().split('T')[0]

export default function NewInvoicePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [type, setType] = useState<'sample'|'correction'|'bulk'>('bulk')
  const [pi, setPi] = useState(() => genPI('bulk'))

  // Client
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientCountry, setClientCountry] = useState('')
  const [clientAddress, setClientAddress] = useState('')

  // Invoice meta
  const [date, setDate] = useState(today)
  const [dueDate, setDueDate] = useState(due30)
  const [po, setPo] = useState('')
  const [incoterm, setIncoterm] = useState('FOB')
  const [pol, setPol] = useState('Chittagong')
  const [pod, setPod] = useState('')
  const [shipMode, setShipMode] = useState('Sea Freight')
  const [shipDate, setShipDate] = useState('')
  const [stage, setStage] = useState<1|2|3>(1)

  // Items
  const [items, setItems] = useState<Item[]>([{ desc: '', code: '', qty: '', rate: '', specs: { color:'', fabric:'', gsm:'', yarn:'', label:'', accessories:'' } }])
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setPi(genPI(type))
  }, [type])

  function addItem() {
    setItems(p => [...p, { desc:'', code:'', qty:'', rate:'', specs:{color:'',fabric:'',gsm:'',yarn:'',label:'',accessories:''} }])
  }
  function removeItem(i: number) {
    setItems(p => p.filter((_,j) => j!==i))
  }
  function updateItem(i: number, field: keyof Item, val: string) {
    setItems(p => p.map((it,j) => j===i ? {...it,[field]:val} : it))
  }
  function updateSpec(i: number, field: string, val: string) {
    setItems(p => p.map((it,j) => j===i ? {...it, specs:{...it.specs!, [field]:val}} : it))
  }

  const subtotal = items.reduce((s,it) => s + (parseFloat(it.qty)||0)*(parseFloat(it.rate)||0), 0)
  const total = Math.max(0, subtotal - (parseFloat(discount)||0))

  async function handleSave() {
    if (!clientName) return setError('Client name is required')
    if (!date) return setError('Invoice date is required')
    setSaving(true); setError('')
    const payload = {
      pi_number: pi, type, status: 'draft',
      client_name: clientName, client_email: clientEmail,
      client_phone: clientPhone, client_country: clientCountry, client_address: clientAddress,
      date, due_date: dueDate, po_number: po, incoterm, port_loading: pol,
      port_discharge: pod, shipment_mode: shipMode, ship_date: shipDate || null,
      stage, items: items.map(it => ({ desc:it.desc, code:it.code, qty:parseFloat(it.qty)||0, rate:parseFloat(it.rate)||0, specs:it.specs })),
      subtotal, discount: parseFloat(discount)||0, total, notes
    }
    const { data, error: err } = await supabase.from('invoices').insert(payload).select().single()
    setSaving(false)
    if (err) setError(err.message)
    else router.push(`/invoices/${data.id}`)
  }

  const Section = ({ title }: { title: string }) => (
    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: 14, paddingBottom: 8, borderBottom: '1.5px solid var(--red-lt)' }}>{title}</div>
  )

  return (
    <AppShell title="New Invoice" actions={
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Invoice'}</button>
      </div>
    }>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {error && <div style={{ background: 'var(--red-lt)', border: '1px solid var(--red-mid)', borderRadius: 'var(--r-sm)', padding: '10px 14px', fontSize: 12.5, color: 'var(--red-dk)', marginBottom: 16 }}>{error}</div>}

        {/* Type + PI */}
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <Section title="Invoice Type" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
            {(['sample','correction','bulk'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                style={{ padding: '11px', border: `1.5px solid ${type===t?'var(--red)':'var(--line)'}`, borderRadius: 'var(--r-sm)', background: type===t?'var(--red-lt)':'var(--field)', color: type===t?'var(--red-dk)':'var(--ink2)', fontFamily:'"DM Sans",sans-serif', fontSize: 13, fontWeight: type===t?600:400, cursor: 'pointer', textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>
          <div className="f2">
            <div className="f"><label>PI Number</label><input value={pi} onChange={e=>setPi(e.target.value)} /></div>
            {type === 'bulk' && <div className="f"><label>Payment Stage</label>
              <select value={stage} onChange={e=>setStage(parseInt(e.target.value) as 1|2|3)}>
                <option value={1}>Stage 1 — 30% Deposit</option>
                <option value={2}>Stage 2 — 30% Mid-Production</option>
                <option value={3}>Stage 3 — 40% Final Balance</option>
              </select>
            </div>}
          </div>
        </div>

        {/* Client */}
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <Section title="Client / Buyer" />
          <div className="f2">
            <div className="f"><label>Client Name *</label><input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Brand name or company" /></div>
            <div className="f"><label>Email</label><input type="email" value={clientEmail} onChange={e=>setClientEmail(e.target.value)} placeholder="buyer@brand.com" /></div>
          </div>
          <div className="f2">
            <div className="f"><label>Phone</label><input value={clientPhone} onChange={e=>setClientPhone(e.target.value)} placeholder="+1 000 000 0000" /></div>
            <div className="f"><label>Country</label><input value={clientCountry} onChange={e=>setClientCountry(e.target.value)} placeholder="United Kingdom" /></div>
          </div>
          <div className="f"><label>Address</label><textarea value={clientAddress} onChange={e=>setClientAddress(e.target.value)} rows={2} placeholder="Full mailing address" /></div>
        </div>

        {/* Dates & Shipping */}
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <Section title="Dates & Shipping" />
          <div className="f3">
            <div className="f"><label>Invoice Date *</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
            <div className="f"><label>Due Date</label><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} /></div>
            <div className="f"><label>Est. Shipment Date</label><input type="date" value={shipDate} onChange={e=>setShipDate(e.target.value)} /></div>
          </div>
          <div className="f3">
            <div className="f"><label>PO Number</label><input value={po} onChange={e=>setPo(e.target.value)} placeholder="PO-2024-001" /></div>
            <div className="f"><label>Incoterm</label>
              <select value={incoterm} onChange={e=>setIncoterm(e.target.value)}>
                {['FOB','CIF','EXW','DDP','CFR','FCA','CPT'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="f"><label>Shipment Mode</label>
              <select value={shipMode} onChange={e=>setShipMode(e.target.value)}>
                {['Sea Freight','Air Freight','Courier'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="f2">
            <div className="f"><label>Port of Loading</label><input value={pol} onChange={e=>setPol(e.target.value)} /></div>
            <div className="f"><label>Port of Discharge</label><input value={pod} onChange={e=>setPod(e.target.value)} placeholder="Felixstowe, UK" /></div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <Section title="Line Items" />
          {items.map((item, i) => (
            <div key={i} style={{ background: 'var(--field)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: 14, marginBottom: 10, position: 'relative' }}>
              {items.length > 1 && (
                <button onClick={() => removeItem(i)} style={{ position:'absolute', top:10, right:10, background:'none', border:'none', cursor:'pointer', color:'var(--muted2)', fontSize:18, lineHeight:1 }}>×</button>
              )}
              <div className="f2" style={{ marginBottom: 8 }}>
                <div className="f" style={{ marginBottom: 0 }}><label>Description</label><input value={item.desc} onChange={e=>updateItem(i,'desc',e.target.value)} placeholder="Garment description" /></div>
                <div className="f" style={{ marginBottom: 0 }}><label>Style / Code</label><input value={item.code} onChange={e=>updateItem(i,'code',e.target.value)} placeholder="SDF-001" /></div>
              </div>
              <div className="f2">
                <div className="f" style={{ marginBottom: 0 }}><label>Quantity (pcs)</label><input type="number" value={item.qty} onChange={e=>updateItem(i,'qty',e.target.value)} placeholder="500" min="0" /></div>
                <div className="f" style={{ marginBottom: 0 }}><label>Unit Rate (USD)</label><input type="number" value={item.rate} onChange={e=>updateItem(i,'rate',e.target.value)} placeholder="8.50" min="0" step="0.01" /></div>
              </div>
              {(parseFloat(item.qty)||0) > 0 && (parseFloat(item.rate)||0) > 0 && (
                <div style={{ textAlign:'right', marginTop:8, fontWeight:700, fontSize:13, color:'var(--red-dk)' }}>
                  = ${((parseFloat(item.qty)||0)*(parseFloat(item.rate)||0)).toLocaleString('en-US',{minimumFractionDigits:2})}
                </div>
              )}
              {/* Specs — shown for bulk */}
              {type === 'bulk' && item.specs && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ fontSize: 11.5, color: 'var(--muted)', cursor: 'pointer', userSelect: 'none' }}>+ Garment Specifications</summary>
                  <div className="f3" style={{ marginTop: 10 }}>
                    {(['color','fabric','gsm','yarn','label','accessories'] as const).map(f => (
                      <div className="f" key={f} style={{ marginBottom: 8 }}>
                        <label style={{ textTransform: 'capitalize' }}>{f}</label>
                        <input value={(item.specs as any)[f]} onChange={e=>updateSpec(i,f,e.target.value)} placeholder={f==='gsm'?'180':'...'} />
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
          <button onClick={addItem} style={{ width:'100%', background:'none', border:'1.5px dashed var(--line)', borderRadius:'var(--r-sm)', color:'var(--muted)', fontSize:12.5, fontFamily:'"DM Sans",sans-serif', cursor:'pointer', padding:10, transition:'all .15s' }}>
            + Add Line Item
          </button>

          {/* Totals */}
          <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'4px 0', color:'var(--muted)' }}>
              <span>Subtotal</span><span>${subtotal.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'4px 0', alignItems:'center' }}>
              <span style={{ color:'var(--muted)' }}>Discount (USD)</span>
              <input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} min="0" step="0.01"
                style={{ width:120, textAlign:'right', background:'var(--field)', border:'1.5px solid var(--line)', borderRadius:'var(--r-sm)', padding:'6px 10px', fontSize:13, fontFamily:'"DM Sans",sans-serif', color:'var(--ink)' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:700, padding:'8px 0 0', borderTop:'1px solid var(--line)', marginTop:4 }}>
              <span>Total</span><span style={{ color:'var(--red-dk)' }}>${total.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
            </div>
            {type === 'bulk' && (
              <div style={{ marginTop: 12, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                {[['Stage 1',total*0.30],['Stage 2',total*0.30],['Stage 3',total*0.40]].map(([l,a]) => (
                  <div key={l as string} style={{ background:'var(--field)', border:'1px solid var(--line)', borderRadius:'var(--r-sm)', padding:'10px 12px', textAlign:'center' }}>
                    <div style={{ fontSize:10.5, color:'var(--muted)', marginBottom:3 }}>{l}</div>
                    <div style={{ fontWeight:700, fontSize:13 }}>${(a as number).toLocaleString('en-US',{minimumFractionDigits:2})}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="card card-pad" style={{ marginBottom: 14 }}>
          <Section title="Internal Notes" />
          <div className="f" style={{ marginBottom: 0 }}>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any internal notes about this order…" rows={3} />
          </div>
        </div>

        {/* Save button */}
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width:'100%', justifyContent:'center', padding:'14px', fontSize:15 }}>
          {saving ? 'Saving Invoice…' : 'Save Invoice'}
        </button>
      </div>
    </AppShell>
  )
}
