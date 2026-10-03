-- Aplicada en Supabase como "clients_phase1_structure" (2026-10-02).
-- Agrupar préstamos por cliente, fase 1: estructura.

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.normalize_client_name(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public, extensions
AS $$
  SELECT lower(extensions.unaccent('extensions.unaccent'::regdictionary, btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'))));
$$;

CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_owner_name_key_unique UNIQUE (owner_id, name_key),
  CONSTRAINT clients_name_key_not_empty CHECK (name_key <> '')
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Solo lectura y alta desde la app. Sin UPDATE ni DELETE: los clientes se borran
-- solo por el trigger de huérfanos o en cascada al borrar la cuenta.
CREATE POLICY "clients_select_own" ON public.clients FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "clients_insert_own" ON public.clients FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

ALTER TABLE public.loans
  ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE;

CREATE INDEX loans_client_id_idx ON public.loans (client_id);
