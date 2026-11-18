-- Seguridad: reseñas y plano de mesas (2026-11-18)
--
-- Reseñas
--   * Lectura: solo admins (antes cualquiera podía descargar todas las opiniones).
--     Solo el panel de admin (AdminReviews) las lee; el formulario solo inserta.
--   * Envío: sigue abierto a todos (formulario público), pero con límites:
--     nota 1-5, categoría restaurant/food/web y texto de hasta 2000 caracteres.
--   * Restricción de categorías alineada con el formulario.
--
-- Plano de mesas (public.tables)
--   * Visitantes sin sesión: ya no pueden verlo.
--   * Clientes con sesión: pueden ver las mesas activas, porque "Mis reservas"
--     las necesita para calcular huecos libres al modificar una reserva.
--   * Admins: ven todas (activas e inactivas), como hasta ahora.
--
-- Idempotente: se puede ejecutar más de una vez sin efectos adicionales.

BEGIN;

-- ── reviews ──────────────────────────────────────────────────────────────────

-- Quitar todas las políticas de lectura/inserción existentes (nombres en prod pueden variar)
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'reviews' AND cmd IN ('SELECT', 'INSERT')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.reviews', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Admins can read reviews" ON public.reviews
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Anyone can submit a valid review" ON public.reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    rating BETWEEN 1 AND 5
    AND category IN ('restaurant', 'food', 'web')
    AND (message IS NULL OR char_length(message) <= 2000)
  );

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_category_valid;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_category_valid
    CHECK (category IN ('restaurant', 'food', 'web')) NOT VALID;
ALTER TABLE public.reviews VALIDATE CONSTRAINT reviews_category_valid;

-- ── tables (plano de mesas) ──────────────────────────────────────────────────

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tables' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.tables', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view active tables" ON public.tables
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all tables" ON public.tables
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

COMMIT;
