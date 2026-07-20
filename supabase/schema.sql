-- Cafe Napoli Database Schema for Supabase
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table statuses enum
create type table_status as enum (
  'available', 'occupied', 'preparing', 'awaiting', 
  'eating', 'reserved', 'cleaning'
);

-- Tables configuration
create table tables (
  id serial primary key,
  shape text not null default 'circle',
  group_name text not null,
  position_x float not null default 0,
  position_y float not null default 0,
  seats integer not null default 4,
  status table_status not null default 'available',
  current_order_id uuid,
  updated_at timestamp with time zone default now()
);

-- Orders
create table orders (
  id uuid primary key default uuid_generate_v4(),
  table_id integer references tables(id) on delete cascade,
  items jsonb not null default '[]',
  subtotal integer not null default 0,
  discount integer not null default 0,
  tax integer not null default 0,
  total integer not null default 0,
  status text not null default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Audit log
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  action_type text not null,
  table_id integer,
  order_id uuid,
  user_id integer,
  user_name text,
  user_role text,
  details jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Enable Real-time
alter publication supabase_realtime add table tables;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table audit_log;

-- Row Level Security (disabled for demo - enable in production)
alter table tables enable row level security;
alter table orders enable row level security;
alter table audit_log enable row level security;

-- Policies (allow all for demo)
create policy "Allow all" on tables for all using (true);
create policy "Allow all" on orders for all using (true);
create policy "Allow all" on audit_log for all using (true);

-- Updated trigger for orders
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

create trigger update_tables_updated_at
  before update on tables
  for each row execute function update_updated_at();
