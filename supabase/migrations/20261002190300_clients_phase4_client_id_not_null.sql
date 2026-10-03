-- Aplicada en Supabase como "clients_phase4_client_id_not_null" (2026-10-02).
-- Solo se aplicó después de comprobar que ningún préstamo quedaba sin cliente.

ALTER TABLE public.loans ALTER COLUMN client_id SET NOT NULL;
