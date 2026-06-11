-- ═══════════════════════════════════════
-- SDF Clothing — Invoice Admin Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════

-- INVOICES TABLE
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  pi_number text not null,
  type text not null check (type in ('sample','correction','bulk')),
  status text not null default 'draft' check (status in ('draft','sent','stage1_paid','stage2_paid','paid','overdue')),

  -- Client
  client_id uuid references public.clients(id) on delete set null,
  client_name text not null,
  client_email text,
  client_phone text,
  client_country text,
  client_address text,

  -- Invoice meta
  date date not null,
  due_date date,
  po_number text,
  incoterm text default 'FOB',
  port_loading text default 'Chittagong',
  port_discharge text,
  shipment_mode text default 'Sea Freight',
  ship_date date,
  stage integer default 1 check (stage in (1,2,3)),

  -- Financials
  items jsonb default '[]'::jsonb,
  subtotal numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  total numeric(12,2) default 0,

  -- Notes
  notes text
);

-- CLIENTS TABLE
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text,
  phone text,
  country text,
  address text,
  notes text
);

-- ROW LEVEL SECURITY — only authenticated user can access
alter table public.invoices enable row level security;
alter table public.clients enable row level security;

create policy "Auth users only" on public.invoices
  for all using (auth.role() = 'authenticated');

create policy "Auth users only" on public.clients
  for all using (auth.role() = 'authenticated');
