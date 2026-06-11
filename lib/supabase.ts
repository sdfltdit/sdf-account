import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Invoice = {
  id: string
  created_at: string
  pi_number: string
  type: 'sample' | 'correction' | 'bulk'
  client_id: string | null
  client_name: string
  client_email: string
  client_country: string
  date: string
  due_date: string
  po_number: string
  incoterm: string
  port_loading: string
  port_discharge: string
  shipment_mode: string
  ship_date: string
  items: LineItem[]
  subtotal: number
  discount: number
  total: number
  stage: 1 | 2 | 3
  payment_method: string
  status: 'draft' | 'sent' | 'stage1_paid' | 'stage2_paid' | 'paid' | 'overdue'
  notes: string
}

export type LineItem = {
  desc: string
  code: string
  qty: number
  rate: number
  specs?: {
    color: string
    fabric: string
    gsm: string
    yarn: string
    label: string
    accessories: string
  }
}

export type Client = {
  id: string
  created_at: string
  name: string
  email: string
  phone: string
  country: string
  address: string
  notes: string
  total_orders: number
  total_value: number
}
