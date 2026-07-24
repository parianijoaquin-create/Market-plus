-- ═══════════════════════════════════════════════════════════════════
-- Market Pulse — retencion de datos
-- Funcion que borra datos viejos segun la politica de cada tabla.
-- La llama el script de sync una vez por dia (primera corrida del dia).
-- Pegar en Supabase → SQL Editor → Run (despues de 0001_init.sql).
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.purge_old_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- fx_rates: 90 dias
  delete from public.fx_rates        where quoted_at  < now() - interval '90 days';
  -- price_snapshots (intradia, lo que mas crece): 14 dias
  delete from public.price_snapshots where quoted_at  < now() - interval '14 days';
  -- sync_runs / sync_errors: 30 dias (errors cae por cascade con su run)
  delete from public.sync_runs       where started_at < now() - interval '30 days';
  delete from public.sync_errors     where created_at < now() - interval '30 days';
  -- daily_prices: se conserva (historial permanente, es liviano)
end $$;

-- Solo el backend (service_role) puede ejecutarla.
revoke all on function public.purge_old_data() from anon, authenticated;
