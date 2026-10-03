-- Aplicada en Supabase como "clients_phase3_rpc_and_trigger" (2026-10-02).
-- Misma firma que antes (las APK 9 a 12 siguen funcionando): busca o crea el cliente.
-- Si es renovación, usa el cliente del crédito anterior.

CREATE OR REPLACE FUNCTION public.create_loan_with_interest(
  p_owner_id uuid,
  p_debtor_name text,
  p_amount numeric,
  p_interes numeric,
  p_payment_method text,
  p_note text,
  p_renewed_from uuid DEFAULT NULL::uuid
)
RETURNS loans
LANGUAGE plpgsql
AS $function$
declare
  v_total numeric;
  v_prev loans;
  v_renewal_number integer := 0;
  v_client_id uuid;
  v_name text;
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
    v_client_id := v_prev.client_id;
  end if;

  if v_client_id is null then
    v_name := btrim(regexp_replace(coalesce(p_debtor_name, ''), '\s+', ' ', 'g'));
    if v_name = '' then
      raise exception 'El nombre del cliente es obligatorio';
    end if;

    insert into clients (owner_id, name, name_key)
    values (p_owner_id, v_name, normalize_client_name(v_name))
    on conflict (owner_id, name_key) do nothing;

    select id, name into v_client_id, v_name
    from clients
    where owner_id = p_owner_id and name_key = normalize_client_name(v_name);
  else
    select name into v_name from clients where id = v_client_id;
  end if;

  v_total := p_amount + (p_amount * (p_interes / 100));

  insert into loans (
    owner_id, debtor_name, client_id, interes, original_amount, remaining,
    payment_method, note, renewed_from, renewal_number
  )
  values (
    p_owner_id, v_name, v_client_id, p_interes, p_amount, v_total,
    p_payment_method, p_note, p_renewed_from, v_renewal_number
  )
  returning * into v_inserted;

  return v_inserted;
end;
$function$;

-- Al borrar el último crédito de un cliente, el cliente se borra también.
CREATE OR REPLACE FUNCTION public.delete_orphan_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
begin
  if old.client_id is not null then
    delete from clients c
    where c.id = old.client_id
      and not exists (select 1 from loans l where l.client_id = c.id);
  end if;
  return old;
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.delete_orphan_client() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER loans_delete_orphan_client
AFTER DELETE ON public.loans
FOR EACH ROW EXECUTE FUNCTION public.delete_orphan_client();
