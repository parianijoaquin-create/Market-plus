-- ═══════════════════════════════════════════════════════════════════
-- Market Pulse — Etapa 1 — esquema inicial
-- Pegar TODO este archivo en Supabase → SQL Editor → Run.
-- Idempotente: se puede correr mas de una vez sin romper.
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1) markets — catalogo de mercados
-- ─────────────────────────────────────────────
create table if not exists public.markets (
  id        smallint primary key,
  code      text not null unique,
  name      text not null,
  timezone  text not null default 'America/Argentina/Buenos_Aires'
);

-- ─────────────────────────────────────────────
-- 2) data_sources — fuentes de datos y su salud
-- ─────────────────────────────────────────────
create table if not exists public.data_sources (
  id          smallint primary key,
  code        text not null unique,
  base_url    text,
  last_ok_at  timestamptz
);

-- ─────────────────────────────────────────────
-- 3) assets — activos (acciones argentinas en Etapa 1)
-- ─────────────────────────────────────────────
create table if not exists public.assets (
  id         bigint generated always as identity primary key,
  market_id  smallint not null references public.markets(id),
  symbol     text not null,
  name       text,
  kind       text not null default 'stock',
  is_active  boolean not null default true,
  unique (market_id, symbol)
);
create index if not exists idx_assets_market on public.assets(market_id);

-- ─────────────────────────────────────────────
-- 4) fx_rates — cotizaciones del dolar (una fila por tipo por lectura)
-- ─────────────────────────────────────────────
create table if not exists public.fx_rates (
  id          bigint generated always as identity primary key,
  kind        text not null,               -- oficial, blue, mep, ccl, mayorista, tarjeta, cripto
  buy         numeric(14,4),
  sell        numeric(14,4) not null,
  source_id   smallint references public.data_sources(id),
  quoted_at   timestamptz not null,
  fetched_at  timestamptz not null default now(),
  unique (kind, quoted_at)
);
create index if not exists idx_fx_kind_quoted on public.fx_rates(kind, quoted_at desc);

-- ─────────────────────────────────────────────
-- 5) price_snapshots — foto intradia de cada accion
-- ─────────────────────────────────────────────
create table if not exists public.price_snapshots (
  id          bigint generated always as identity primary key,
  asset_id    bigint not null references public.assets(id),
  price       numeric(18,4) not null,
  prev_close  numeric(18,4),
  change_pct  numeric(9,4),
  volume      numeric(20,2),
  source_id   smallint references public.data_sources(id),
  quoted_at   timestamptz not null,
  fetched_at  timestamptz not null default now(),
  unique (asset_id, quoted_at)
);
create index if not exists idx_snap_asset_quoted on public.price_snapshots(asset_id, quoted_at desc);
create index if not exists idx_snap_quoted on public.price_snapshots(quoted_at desc);

-- ─────────────────────────────────────────────
-- 6) daily_prices — cierre diario consolidado (historial)
-- ─────────────────────────────────────────────
create table if not exists public.daily_prices (
  asset_id    bigint not null references public.assets(id),
  trade_date  date not null,
  open        numeric(18,4),
  high        numeric(18,4),
  low         numeric(18,4),
  close       numeric(18,4),
  change_pct  numeric(9,4),
  volume      numeric(20,2),
  primary key (asset_id, trade_date)
);
create index if not exists idx_daily_date on public.daily_prices(trade_date desc);

-- ─────────────────────────────────────────────
-- 7) sync_runs — bitacora de cada corrida del cron
-- ─────────────────────────────────────────────
create table if not exists public.sync_runs (
  id           bigint generated always as identity primary key,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'ok',   -- ok | partial | failed
  sources      jsonb,
  rows_written int default 0
);
create index if not exists idx_runs_started on public.sync_runs(started_at desc);

-- ─────────────────────────────────────────────
-- 8) sync_errors — errores puntuales
-- ─────────────────────────────────────────────
create table if not exists public.sync_errors (
  id          bigint generated always as identity primary key,
  run_id      bigint references public.sync_runs(id) on delete cascade,
  source_id   smallint references public.data_sources(id),
  message     text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_errors_created on public.sync_errors(created_at desc);

-- ═══════════════════════════════════════════════════════════════════
-- RLS — Row Level Security
-- Etapa 1: todo lo lee cualquiera (anon). NADIE escribe con anon.
-- El script de sync usa la service_role key, que ignora RLS por diseno.
-- ═══════════════════════════════════════════════════════════════════
alter table public.markets         enable row level security;
alter table public.data_sources    enable row level security;
alter table public.assets          enable row level security;
alter table public.fx_rates        enable row level security;
alter table public.price_snapshots enable row level security;
alter table public.daily_prices    enable row level security;
alter table public.sync_runs       enable row level security;
alter table public.sync_errors     enable row level security;

-- Policies de solo lectura publica (idempotentes)
do $$
declare t text;
begin
  foreach t in array array[
    'markets','data_sources','assets','fx_rates',
    'price_snapshots','daily_prices','sync_runs','sync_errors'
  ]
  loop
    execute format(
      'drop policy if exists %I on public.%I;', 'read_public_' || t, t
    );
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true);',
      'read_public_' || t, t
    );
  end loop;
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- Seeds — datos base
-- ═══════════════════════════════════════════════════════════════════
insert into public.markets (id, code, name) values
  (1, 'BCBA', 'Acciones Argentinas'),
  (2, 'FX',   'Divisas')
on conflict (id) do nothing;

insert into public.data_sources (id, code, base_url) values
  (1, 'dolarapi',   'https://dolarapi.com'),
  (2, 'data912',    'https://data912.com'),
  (3, 'bluelytics', 'https://api.bluelytics.com.ar')
on conflict (id) do nothing;

-- Panel lider del Merval (lista curada). El sync solo guarda estos simbolos.
insert into public.assets (market_id, symbol, name, kind) values
  (1, 'GGAL',  'Grupo Financiero Galicia', 'stock'),
  (1, 'YPFD',  'YPF', 'stock'),
  (1, 'PAMP',  'Pampa Energia', 'stock'),
  (1, 'BMA',   'Banco Macro', 'stock'),
  (1, 'BBAR',  'BBVA Argentina', 'stock'),
  (1, 'SUPV',  'Grupo Supervielle', 'stock'),
  (1, 'ALUA',  'Aluar', 'stock'),
  (1, 'TXAR',  'Ternium Argentina', 'stock'),
  (1, 'LOMA',  'Loma Negra', 'stock'),
  (1, 'CEPU',  'Central Puerto', 'stock'),
  (1, 'TGSU2', 'Transportadora Gas del Sur', 'stock'),
  (1, 'TGNO4', 'Transportadora Gas del Norte', 'stock'),
  (1, 'TRAN',  'Transener', 'stock'),
  (1, 'EDN',   'Edenor', 'stock'),
  (1, 'CRES',  'Cresud', 'stock'),
  (1, 'IRSA',  'IRSA', 'stock'),
  (1, 'COME',  'Sociedad Comercial del Plata', 'stock'),
  (1, 'VALO',  'Grupo Financiero Valores', 'stock'),
  (1, 'MIRG',  'Mirgor', 'stock'),
  (1, 'TECO2', 'Telecom Argentina', 'stock'),
  (1, 'CVH',   'Cablevision Holding', 'stock'),
  (1, 'BYMA',  'Bolsas y Mercados Argentinos', 'stock'),
  (1, 'METR',  'MetroGAS', 'stock'),
  (1, 'HARG',  'Holcim Argentina', 'stock')
on conflict (market_id, symbol) do nothing;
