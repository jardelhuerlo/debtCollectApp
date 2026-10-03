-- Aplicada en Supabase como "process_payment_reject_overpayment" (2026-10-02).
-- Un pago no puede superar el restante del crédito. Antes se registraba el monto
-- completo y el restante se dejaba en 0 (el pago quedaba por más de lo que se debía).
-- Para revertir: restaurar la definición anterior de process_payment que está en
-- supabase/rollback/2026-10-02_estado_antes_de_clientes.sql (sección 4).

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

  IF p_amount > v_remaining THEN
    RAISE EXCEPTION 'El monto no puede superar el restante';
  END IF;

  -- Determinar si es un día sin pago
  v_is_zero := (p_amount = 0 OR p_method = 'sin_pago');

  -- Registrar el pago
  INSERT INTO payments(loan_id, payer_id, amount, note, method)
  VALUES (p_loan_id, p_payer_id, p_amount, p_note, p_method);

  -- Calcular nuevo restante
  v_remaining := v_remaining - p_amount;

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
