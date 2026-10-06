create extension if not exists pgcrypto;

create table if not exists public.store_catalog (
  id text primary key,
  name text not null unique,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  active boolean not null default true
);

insert into public.store_catalog (id, name, unit_price) values
  ('graphic-nexus', 'Graphic Nexus', 249.00),
  ('nexus-logo-tee', 'Nexus Logo Tee', 189.00),
  ('cap-nexus', 'Cap Nexus', 119.00),
  ('utility-cargo', 'Utility Cargo', 329.00)
on conflict (id) do update set name = excluded.name, unit_price = excluded.unit_price, active = true;

create table if not exists public.delivery_options (
  id text primary key,
  name text not null,
  fee numeric(10,2) not null check (fee >= 0),
  estimate text not null,
  requires_address boolean not null default true,
  active boolean not null default true,
  display_order integer not null default 0
);

insert into public.delivery_options (id, name, fee, estimate, requires_address, display_order) values
  ('store_pickup', 'Retirada na loja física', 0.00, 'Combine o horário após a confirmação', false, 1),
  ('local_courier', 'Entrega local / motoboy', 10.00, '1 dia útil', true, 2),
  ('express_carrier', 'Transportadora expressa', 25.00, '3 dias úteis', true, 3),
  ('sedex', 'Correios - SEDEX', 38.00, '5 dias úteis', true, 4),
  ('same_day', 'Entrega relâmpago / same day', 50.00, 'Até 3 horas', true, 5)
on conflict (id) do update set name = excluded.name, fee = excluded.fee, estimate = excluded.estimate,
  requires_address = excluded.requires_address, active = true, display_order = excluded.display_order;

create table if not exists public.customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  birth_date date,
  gender_identity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.customer_profiles add column if not exists sexual_orientation text;

create table if not exists public.store_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null,
  total numeric(10,2) not null,
  delivery_option_id text not null references public.delivery_options(id),
  delivery_name text not null,
  delivery_phone text,
  delivery_street text,
  delivery_number text,
  delivery_complement text,
  delivery_cep text,
  payment_method text not null check (payment_method in ('pix', 'cartao', 'boleto')),
  created_at timestamptz not null default now()
);

create table if not exists public.store_order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.store_orders(id) on delete cascade,
  product_id text not null references public.store_catalog(id),
  product_name text not null,
  size text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0)
);

alter table public.store_catalog enable row level security;
alter table public.delivery_options enable row level security;
alter table public.customer_profiles enable row level security;
alter table public.store_orders enable row level security;
alter table public.store_order_items enable row level security;

drop policy if exists "active catalog is readable" on public.store_catalog;
create policy "active catalog is readable" on public.store_catalog for select to anon, authenticated using (active);
drop policy if exists "active delivery methods are readable" on public.delivery_options;
create policy "active delivery methods are readable" on public.delivery_options for select to anon, authenticated using (active);
drop policy if exists "customers read own profile" on public.customer_profiles;
create policy "customers read own profile" on public.customer_profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "customers insert own profile" on public.customer_profiles;
create policy "customers insert own profile" on public.customer_profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "customers update own profile" on public.customer_profiles;
create policy "customers update own profile" on public.customer_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "customers read own orders" on public.store_orders;
create policy "customers read own orders" on public.store_orders for select to authenticated using (auth.uid() = user_id);
drop policy if exists "customers read own order items" on public.store_order_items;
create policy "customers read own order items" on public.store_order_items for select to authenticated
  using (exists (select 1 from public.store_orders o where o.id = order_id and o.user_id = auth.uid()));

grant select on public.store_catalog, public.delivery_options to anon, authenticated;
grant select, insert, update on public.customer_profiles to authenticated;
grant select on public.store_orders, public.store_order_items to authenticated;

create or replace function public.create_store_order(
  p_items jsonb,
  p_delivery_option_id text,
  p_payment_method text,
  p_customer_name text,
  p_customer_phone text default null,
  p_street text default null,
  p_number text default null,
  p_complement text default null,
  p_cep text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_delivery public.delivery_options%rowtype;
  v_item jsonb;
  v_product public.store_catalog%rowtype;
  v_quantity integer;
  v_size text;
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_order_id uuid := gen_random_uuid();
begin
  if v_user_id is null then raise exception 'É necessário entrar na conta para comprar.'; end if;
  if p_items is null or jsonb_typeof(p_items) is distinct from 'array' then raise exception 'Formato de carrinho inválido.'; end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'O carrinho está vazio.'; end if;
  if p_payment_method is null or p_payment_method not in ('pix', 'cartao', 'boleto') then raise exception 'Forma de pagamento inválida.'; end if;

  select * into v_delivery from public.delivery_options where id = p_delivery_option_id and active;
  if not found then raise exception 'A modalidade de entrega selecionada não está disponível.'; end if;
  if v_delivery.requires_address and (nullif(trim(p_street), '') is null or nullif(trim(p_number), '') is null or nullif(trim(p_cep), '') is null) then
    raise exception 'Informe rua, número e CEP para esta modalidade de entrega.';
  end if;
  if nullif(trim(p_customer_name), '') is null then raise exception 'Informe o nome para o pedido.'; end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.store_catalog where name = v_item->>'name' and active;
    if not found then raise exception 'Um produto do carrinho não está mais disponível.'; end if;
    v_quantity := (v_item->>'quantity')::integer;
    v_size := nullif(trim(v_item->>'size'), '');
    if v_quantity is null or v_quantity < 1 or v_quantity > 50 or v_size is null then raise exception 'Quantidade ou tamanho inválido.'; end if;
    v_subtotal := v_subtotal + v_product.unit_price * v_quantity;
  end loop;

  if p_payment_method = 'pix' then v_discount := round(v_subtotal * 0.10, 2); end if;
  insert into public.store_orders (id, user_id, subtotal, discount, delivery_fee, total, delivery_option_id,
    delivery_name, delivery_phone, delivery_street, delivery_number, delivery_complement, delivery_cep, payment_method)
  values (v_order_id, v_user_id, v_subtotal, v_discount, v_delivery.fee, v_subtotal - v_discount + v_delivery.fee,
    v_delivery.id, trim(p_customer_name), nullif(trim(p_customer_phone), ''), nullif(trim(p_street), ''),
    nullif(trim(p_number), ''), nullif(trim(p_complement), ''), nullif(trim(p_cep), ''), p_payment_method);

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.store_catalog where name = v_item->>'name' and active;
    insert into public.store_order_items (order_id, product_id, product_name, size, unit_price, quantity)
    values (v_order_id, v_product.id, v_product.name, trim(v_item->>'size'), v_product.unit_price, (v_item->>'quantity')::integer);
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.create_store_order(jsonb, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_store_order(jsonb, text, text, text, text, text, text, text, text) to authenticated;

create or replace function public.create_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.customer_profiles (id, full_name, phone, birth_date, gender_identity)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'phone',
    nullif(new.raw_user_meta_data->>'birth_date', '')::date, new.raw_user_meta_data->>'gender_identity')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_store_profile on auth.users;
create trigger on_auth_user_created_store_profile after insert on auth.users
  for each row execute procedure public.create_customer_profile();