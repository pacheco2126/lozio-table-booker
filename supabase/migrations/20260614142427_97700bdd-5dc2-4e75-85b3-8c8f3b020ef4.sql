
-- 1) Restringir UPDATE de usuarios sobre sus reservas: no pueden cambiar status a confirmed
DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;

CREATE POLICY "Users can update own reservations"
ON public.reservations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('pending', 'cancelled')
);

-- 2) Policies para discount_validation_attempts (rate limit). Solo service_role accede.
--    Las inserts vienen del RPC SECURITY DEFINER, que bypasea RLS, así que no necesitamos
--    abrir a authenticated. Bloqueamos explícitamente.
CREATE POLICY "No client access to validation attempts"
ON public.discount_validation_attempts
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);
