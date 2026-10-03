-- Aplicada en Supabase como "clients_phase2_backfill" (2026-10-02).
-- Relleno: un cliente por (dueño, nombre normalizado) y asociación de cada préstamo.

INSERT INTO public.clients (owner_id, name, name_key)
SELECT DISTINCT ON (owner_id, name_key) owner_id, display_name, name_key
FROM (
  SELECT owner_id,
         btrim(regexp_replace(debtor_name, '\s+', ' ', 'g')) AS display_name,
         public.normalize_client_name(debtor_name) AS name_key,
         created_at
  FROM public.loans
  WHERE owner_id IS NOT NULL
) s
ORDER BY owner_id, name_key, created_at DESC;

UPDATE public.loans l
SET client_id = c.id
FROM public.clients c
WHERE c.owner_id = l.owner_id
  AND c.name_key = public.normalize_client_name(l.debtor_name);
