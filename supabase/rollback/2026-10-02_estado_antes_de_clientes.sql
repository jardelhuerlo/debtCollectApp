-- =====================================================================
-- ESTADO DE LA BASE DE DATOS ANTES DE "AGRUPAR PRÉSTAMOS POR CLIENTE"
-- Proyecto Supabase: doognpanlarlvnwkbwdz (PayTrack / JPBD)
-- Capturado: 2026-10-02
--
-- Este archivo es de REFERENCIA Y REVERSIÓN. No contiene datos de usuarios,
-- solo estructura y funciones. Los datos de loans y payments están copiados
-- en el esquema `respaldo` de la base de datos (tablas loans_20261002 y
-- payments_20261002).
--
-- Contenido al momento de la captura:
--   loans: 6 filas | payments: 24 filas | profiles: 2 | auth.users: 3
--   RLS activo solo en profiles y stripe_subscriptions.
--   RLS DESACTIVADO en loans, payments y subscriptions (pendiente aparte).
-- Migraciones aplicadas hasta aquí (supabase_migrations):
--   20261002021754 admin_screen_and_subscription_day2
--   20261002025529 loans_last_payment_was_zero
--   20261002051016 add_push_token_to_profiles
--   20261002051123 expiry_push_notifications_cron
--   20261002062012 fix_expiry_day2_ecuador_timezone
--   20261002161015 loans_renewal_link
-- Extensiones: pg_cron 1.6.4, pg_net 0.19.5, pg_stat_statements, pgcrypto,
--   plpgsql, supabase_vault, uuid-ossp. (unaccent NO está instalada.)
-- =====================================================================


-- =====================================================================
-- 1. TABLAS (tal como están hoy)
-- =====================================================================

CREATE TABLE public.loans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  debtor_name text NOT NULL,
  original_amount numeric(12,2) NOT NULL,
  remaining numeric(12,2) NOT NULL,
  status text DEFAULT 'activo'::text,
  payment_method text,
  note text,
  created_at timestamptz DEFAULT now(),
  interes integer,
  last_payment_was_zero boolean NOT NULL DEFAULT false,
  renewed_from uuid,
  renewal_number integer NOT NULL DEFAULT 0,
  CONSTRAINT loans_pkey PRIMARY KEY (id),
  CONSTRAINT loans_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT loans_renewed_from_fkey FOREIGN KEY (renewed_from) REFERENCES public.loans(id) ON DELETE SET NULL,
  CONSTRAINT loans_payment_method_check CHECK ((payment_method = ANY (ARRAY['efectivo'::text, 'transferencia'::text])))
);
CREATE INDEX loans_owner_id_idx ON public.loans USING btree (owner_id);
CREATE UNIQUE INDEX loans_renewed_from_key ON public.loans USING btree (renewed_from) WHERE (renewed_from IS NOT NULL);

CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  loan_id uuid,
  payer_id uuid,
  amount numeric(12,2) NOT NULL,
  note text,
  created_at timestamptz DEFAULT now(),
  method text,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_loan_id_fkey FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE,
  CONSTRAINT payments_payer_id_fkey FOREIGN KEY (payer_id) REFERENCES public.profiles(id)
);
CREATE INDEX payments_loan_id_idx ON public.payments USING btree (loan_id);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  role text DEFAULT 'user'::text,
  is_active boolean DEFAULT true,
  subscription_expires timestamptz,
  created_at timestamptz DEFAULT now(),
  email text,
  push_token text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_profiles_subscription ON public.profiles USING btree (subscription_expires, is_active);

CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric(12,2) NOT NULL,
  payment_method text,
  provider_payment_id text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions USING btree (user_id);

CREATE TABLE public.stripe_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text DEFAULT 'inactive'::text,
  plan_type text DEFAULT 'monthly'::text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT stripe_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT stripe_subscriptions_user_id_key UNIQUE (user_id),
  CONSTRAINT stripe_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_stripe_subscriptions_stripe_customer_id ON public.stripe_subscriptions USING btree (stripe_customer_id);
CREATE INDEX idx_stripe_subscriptions_stripe_subscription_id ON public.stripe_subscriptions USING btree (stripe_subscription_id);


-- =====================================================================
-- 2. RLS Y POLÍTICAS
-- =====================================================================
-- RLS activado:   profiles, stripe_subscriptions
-- RLS desactivado: loans, payments, subscriptions  (sin políticas)
--
-- profiles:
--   "Users can update own profile"       UPDATE  public         USING (auth.uid() = id)
--   "Users can view own profile"         SELECT  public         USING (auth.uid() = id)
--   "allow inserts from auth trigger"    INSERT  authenticated  WITH CHECK (true)
--   "allow user to select own profile"   SELECT  authenticated  USING (id = auth.uid())
-- stripe_subscriptions:
--   "Users can view own subscription"    SELECT  public         USING (auth.uid() = user_id)


-- =====================================================================
-- 3. TRIGGERS
-- =====================================================================
-- profiles: trigger_extend_subscription  BEFORE UPDATE -> extend_subscription_on_activate()
-- auth.users: on_auth_user_created       AFTER INSERT  -> handle_new_user()
--
-- OJO (hallazgo): extend_subscription_on_activate() pisa subscription_expires con
-- now() + 30 días cada vez que is_active pasa de false a true. Eso anula el
-- "día 2" que calcula admin_update_user al activar a un usuario inactivo.
-- loans y payments NO tienen triggers.


-- =====================================================================
-- 4. FUNCIONES (definiciones exactas)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
 RETURNS TABLE(id uuid, full_name text, email text, role text, is_active boolean, subscription_expires timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  caller_role text;
BEGIN
  SELECT p.role INTO caller_role FROM public.profiles p WHERE p.id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
    SELECT p.id, p.full_name, p.email, p.role, p.is_active, p.subscription_expires, p.created_at
    FROM public.profiles p
    ORDER BY p.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_user(target_user_id uuid, new_is_active boolean DEFAULT NULL::boolean, extend_subscription boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  caller_role text;
  next_expiry timestamptz;
BEGIN
  SELECT p.role INTO caller_role FROM public.profiles p WHERE p.id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF extend_subscription THEN
    next_expiry := (DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Guayaquil') + INTERVAL '1 month' + INTERVAL '1 day') AT TIME ZONE 'America/Guayaquil';
  END IF;

  UPDATE public.profiles
  SET
    is_active = COALESCE(new_is_active, is_active),
    subscription_expires = COALESCE(next_expiry, subscription_expires)
  WHERE id = target_user_id;
END;
$function$;

-- ESTA es la definición que se reemplazará al agrupar por clientes.
-- Para revertir: borrar la versión nueva y volver a crear esta.
CREATE OR REPLACE FUNCTION public.create_loan_with_interest(p_owner_id uuid, p_debtor_name text, p_amount numeric, p_interes numeric, p_payment_method text, p_note text, p_renewed_from uuid DEFAULT NULL::uuid)
 RETURNS loans
 LANGUAGE plpgsql
AS $function$
declare
  v_total numeric;
  v_prev loans;
  v_renewal_number integer := 0;
  v_inserted loans;
begin
  if p_renewed_from is not null then
    select * into v_prev from loans where id = p_renewed_from and owner_id = p_owner_id;
    if not found then
      raise exception 'El crédito a renovar no existe';
    end if;
    if v_prev.remaining > 0 then
      raise exception 'El crédito anterior aún no está pagado';
    end if;
    if exists (select 1 from loans where renewed_from = p_renewed_from) then
      raise exception 'Este crédito ya fue renovado';
    end if;
    v_renewal_number := v_prev.renewal_number + 1;
  end if;

  v_total := p_amount + (p_amount * (p_interes / 100));

  insert into loans (
    owner_id, debtor_name, interes, original_amount, remaining,
    payment_method, note, renewed_from, renewal_number
  )
  values (
    p_owner_id, p_debtor_name, p_interes, p_amount, v_total,
    p_payment_method, p_note, p_renewed_from, v_renewal_number
  )
  returning * into v_inserted;

  return v_inserted;
end;
$function$;

CREATE OR REPLACE FUNCTION public.deactivate_expired_subscriptions()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE profiles
  SET is_active = false
  WHERE subscription_expires <= now()
    AND is_active = true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.extend_subscription_on_activate()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  IF NEW.is_active = true AND OLD.is_active = false THEN
    NEW.subscription_expires := now() + interval '30 days';
  END IF;

  RETURN NEW;
END;$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active, subscription_expires)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.email,
    'trial',
    true,
    (DATE_TRUNC('month', NOW() AT TIME ZONE 'America/Guayaquil') + INTERVAL '1 month' + INTERVAL '1 day') AT TIME ZONE 'America/Guayaquil'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_payment(p_loan_id uuid, p_payer_id uuid, p_amount numeric, p_note text DEFAULT NULL::text, p_method text DEFAULT 'efectivo'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_remaining numeric;
  v_is_zero boolean;
BEGIN
  SELECT remaining INTO v_remaining
  FROM loans
  WHERE id = p_loan_id;

  IF v_remaining IS NULL THEN
    RAISE EXCEPTION 'El préstamo no existe';
  END IF;

  IF p_amount < 0 THEN
    RAISE EXCEPTION 'El monto no puede ser negativo';
  END IF;

  -- Determinar si es un día sin pago
  v_is_zero := (p_amount = 0 OR p_method = 'sin_pago');

  -- Registrar el pago
  INSERT INTO payments(loan_id, payer_id, amount, note, method)
  VALUES (p_loan_id, p_payer_id, p_amount, p_note, p_method);

  -- Calcular nuevo restante
  v_remaining := v_remaining - p_amount;
  IF v_remaining < 0 THEN
    v_remaining := 0;
  END IF;

  -- Actualizar préstamo con flag
  UPDATE loans
  SET
    remaining = v_remaining,
    status = CASE WHEN v_remaining = 0 THEN 'Pagado' ELSE 'Pendiente' END,
    last_payment_was_zero = v_is_zero
  WHERE id = p_loan_id;

  RETURN 'OK';
END;
$function$;

CREATE OR REPLACE FUNCTION public.send_expiry_push_notifications()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  messages jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'to', push_token,
    'title', 'Tu suscripción está por vencer',
    'body', 'Tu suscripción vence en 2 días. Contacta al administrador para renovarla.',
    'sound', 'default'
  ))
  INTO messages
  FROM public.profiles
  WHERE is_active = true
    AND push_token IS NOT NULL
    AND subscription_expires IS NOT NULL
    AND (subscription_expires AT TIME ZONE 'America/Guayaquil')::date
        = (now() AT TIME ZONE 'America/Guayaquil')::date + 2;

  IF messages IS NULL THEN
    RETURN 0;
  END IF;

  PERFORM net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
    body := messages
  );

  RETURN jsonb_array_length(messages);
END;
$function$;


-- =====================================================================
-- 5. TAREAS PROGRAMADAS (pg_cron)
-- =====================================================================
-- deactivate-expired-profiles     "0 * * * *"   SELECT public.deactivate_expired_subscriptions();
-- send-expiry-push-notifications  "0 14 * * *"  SELECT public.send_expiry_push_notifications();   -- 9 AM Ecuador


-- =====================================================================
-- 6. CÓMO REVERTIR EL CAMBIO DE CLIENTES (plan: nombres previstos)
--    Ejecutar en este orden. Los nombres exactos se confirmarán al crear
--    la migración; actualizar esta sección si cambian.
-- =====================================================================
--
-- a) Quitar el trigger y su función de borrado de clientes huérfanos:
--      DROP TRIGGER IF EXISTS loans_delete_orphan_client ON public.loans;
--      DROP FUNCTION IF EXISTS public.delete_orphan_client();
--
-- b) Volver a la función de crear préstamo (sección 4 de este archivo):
--      DROP FUNCTION IF EXISTS public.create_loan_with_interest(uuid, text, numeric, numeric, text, text, uuid);
--      -- y volver a ejecutar el CREATE OR REPLACE de arriba.
--
-- c) Quitar la relación con clientes (los datos de préstamos no se pierden):
--      ALTER TABLE public.loans DROP COLUMN IF EXISTS client_id;
--      DROP TABLE IF EXISTS public.clients;
--      DROP FUNCTION IF EXISTS public.normalize_client_name(text);
--
-- d) Si fuera necesario recuperar los datos tal como estaban:
--      -- Verificar primero: SELECT count(*) FROM respaldo.loans_20261002;  (6)
--      --                    SELECT count(*) FROM respaldo.payments_20261002; (24)
--      -- Restaurar solo si loans/payments quedaron dañados:
--      --   (usar lista explícita de columnas: loans tendrá client_id después del cambio)
--      --   TRUNCATE public.payments, public.loans CASCADE;
--      --   INSERT INTO public.loans (id, owner_id, debtor_name, original_amount, remaining, status,
--      --     payment_method, note, created_at, interes, last_payment_was_zero, renewed_from, renewal_number)
--      --   SELECT id, owner_id, debtor_name, original_amount, remaining, status,
--      --     payment_method, note, created_at, interes, last_payment_was_zero, renewed_from, renewal_number
--      --   FROM respaldo.loans_20261002;
--      --   INSERT INTO public.payments (id, loan_id, payer_id, amount, note, created_at, method)
--      --   SELECT id, loan_id, payer_id, amount, note, created_at, method FROM respaldo.payments_20261002;
--      -- Cuando todo esté verificado, borrar el respaldo:
--      --   DROP SCHEMA respaldo CASCADE;
--
-- e) La app: revertir el commit del cambio en la app. Las APK 9 a 12 siguen
--    funcionando con la función antigua de la sección 4.
