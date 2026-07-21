-- ============================================
-- Cafe Napolitan - Database Schema v2.0
-- PostgreSQL with Supabase
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
create type table_status as enum (
  'available', 'occupied', 'preparing', 'awaiting',
  'eating', 'reserved', 'cleaning'
);

create type order_status as enum (
  'pending', 'preparing', 'ready', 'delivered', 'paid', 'cancelled'
);

create type user_role as enum ('manager', 'kitchen', 'waiter');

create type takeaway_type as enum ('phone', 'snapfood', 'snapp', 'tourbon', 'other');

create type audit_action_type as enum (
  'login', 'logout', 'login_failed',
  'order', 'order_update', 'order_paid', 'order_cancelled',
  'discount', 'status',
  'table_create', 'table_update', 'table_delete',
  'menu_create', 'menu_update', 'menu_delete',
  'user_create', 'user_update', 'user_delete'
);

-- ============================================
-- TABLES
-- ============================================

-- App Users (Authentication)
create table app_users (
  id serial primary key,
  username varchar(50) unique not null,
  password_hash varchar(255) not null,
  salt varchar(32) not null,
  is_active boolean default true,
  failed_login_attempts integer default 0,
  locked_until timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_login_at timestamp with time zone
);

-- User Profiles
create table user_profiles (
  id serial primary key,
  user_id integer not null references app_users(id) on delete cascade,
  name text not null,
  role user_role not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

-- Tables (Restaurant Floor)
create table restaurant_tables (
  id serial primary key,
  shape varchar(20) not null default 'circle',
  group_name text not null,
  position_x float not null default 0,
  position_y float not null default 0,
  seats integer not null default 4,
  status table_status not null default 'available',
  floor integer not null default 1,
  current_order_id uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Menu Categories
create table menu_categories (
  id text primary key,
  name text not null,
  icon text not null,
  sort_order integer not null default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Menu Items
create table menu_items (
  id text primary key,
  name text not null,
  name_en text,
  category_id text not null references menu_categories(id) on delete restrict,
  price integer not null default 0,
  description text,
  image text,
  available boolean default true,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Orders
create table orders (
  id uuid primary key default uuid_generate_v4(),
  table_id integer references restaurant_tables(id) on delete set null,
  items jsonb not null default '[]',
  subtotal integer not null default 0,
  discount integer default 0,
  discount_percent integer,
  tax integer default 0,
  tax_percent integer,
  total integer not null default 0,
  status order_status not null default 'pending',
  created_by integer references app_users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  paid_at timestamp with time zone,
  payment_method varchar(20)
);

-- Takeaway Orders
create table takeaway_orders (
  id uuid primary key default uuid_generate_v4(),
  items jsonb not null default '[]',
  subtotal integer not null default 0,
  discount integer default 0,
  discount_percent integer,
  tax integer default 0,
  tax_percent integer,
  total integer not null default 0,
  status order_status not null default 'pending',
  customer_name text,
  customer_phone text,
  address text not null,
  order_type takeaway_type not null default 'phone',
  notes text,
  created_by integer references app_users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  paid_at timestamp with time zone,
  payment_method varchar(20)
);

-- Audit Log
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id integer references app_users(id) on delete set null,
  user_name text,
  user_role user_role,
  action_type audit_action_type not null,
  action text not null,
  details jsonb default '{}',
  table_id integer,
  order_id uuid,
  created_at timestamp with time zone default now()
);

-- Sessions (for JWT refresh tokens)
create table user_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id integer not null references app_users(id) on delete cascade,
  token_hash varchar(64) not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  revoked_at timestamp with time zone
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_app_users_username on app_users(username);
create index idx_app_users_active on app_users(is_active) where is_active = true;
create index idx_user_profiles_role on user_profiles(role);
create index idx_restaurant_tables_status on restaurant_tables(status);
create index idx_restaurant_tables_floor on restaurant_tables(floor);
create index idx_menu_items_category on menu_items(category_id);
create index idx_menu_items_available on menu_items(available);
create index idx_orders_table_id on orders(table_id);
create index idx_orders_status on orders(status);
create index idx_orders_created_at on orders(created_at);
create index idx_takeaway_orders_status on takeaway_orders(status);
create index idx_takeaway_orders_created_at on takeaway_orders(created_at);
create index idx_audit_log_user_id on audit_log(user_id);
create index idx_audit_log_created_at on audit_log(created_at);
create index idx_audit_log_action_type on audit_log(action_type);
create index idx_user_sessions_user_id on user_sessions(user_id);
create index idx_user_sessions_expires on user_sessions(expires_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table app_users enable row level security;
alter table user_profiles enable row level security;
alter table restaurant_tables enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table takeaway_orders enable row level security;
alter table audit_log enable row level security;
alter table user_sessions enable row level security;

-- Policies for app_users
create policy "Users can view their own data" on app_users
  for select using (true);
create policy "Users can update own password" on app_users
  for update using (true);

-- Policies for user_profiles
create policy "Anyone can view active profiles" on user_profiles
  for select using (true);
create policy "Managers can manage profiles" on user_profiles
  for all using (
    exists (
      select 1 from user_profiles up
      join app_users au on up.user_id = au.id
      where up.user_id = auth.uid() and up.role = 'manager'
    )
  );

-- Policies for restaurant_tables
create policy "Anyone can view tables" on restaurant_tables
  for select using (true);
create policy "Staff can update tables" on restaurant_tables
  for update using (
    exists (
      select 1 from user_profiles where user_id = auth.uid()
    )
  );

-- Policies for menu_items
create policy "Anyone can view available menu items" on menu_items
  for select using (available = true);
create policy "Managers can manage menu" on menu_items
  for all using (
    exists (
      select 1 from user_profiles where user_id = auth.uid() and role = 'manager'
    )
  );

-- Policies for orders
create policy "Staff can view orders" on orders
  for select using (
    exists (select 1 from user_profiles where user_id = auth.uid())
  );
create policy "Staff can create orders" on orders
  for insert with check (
    exists (select 1 from user_profiles where user_id = auth.uid())
  );
create policy "Staff can update their own orders" on orders
  for update using (
    created_by = auth.uid() or
    exists (select 1 from user_profiles where user_id = auth.uid() and role = 'manager')
  );

-- Policies for audit_log
create policy "Managers can view audit log" on audit_log
  for select using (
    exists (select 1 from user_profiles where user_id = auth.uid() and role = 'manager')
  );
create policy "System can insert audit logs" on audit_log
  for insert with check (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_app_users_updated_at
  before update on app_users
  for each row execute function update_updated_at_column();

create trigger update_user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_updated_at_column();

create trigger update_restaurant_tables_updated_at
  before update on restaurant_tables
  for each row execute function update_updated_at_column();

create trigger update_menu_categories_updated_at
  before update on menu_categories
  for each row execute function update_updated_at_column();

create trigger update_menu_items_updated_at
  before update on menu_items
  for each row execute function update_updated_at_column();

create trigger update_orders_updated_at
  before update on orders
  for each row execute function update_updated_at_column();

create trigger update_takeaway_orders_updated_at
  before update on takeaway_orders
  for each row execute function update_updated_at_column();

-- ============================================
-- REALTIME
-- ============================================
alter publication supabase_realtime add table restaurant_tables;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table takeaway_orders;
alter publication supabase_realtime add table menu_items;
