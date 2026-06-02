-- Add two new roles needed for the inventory management module.
--
-- pizzeriaRincon: staff for El Rincón de Lo Zio (panini bar), scoped the same way
--   as pizzeriaTarragona / pizzeriaArrabassada — can do stock recounts and purchase
--   entries for their store only.
--
-- god: owner role with full cross-store inventory access + catalog management.
--   Equivalent to admin for inventory purposes but kept separate so admin accounts
--   (e.g. technical admins) don't automatically get owner visibility into purchasing
--   data.
--
-- Must be a standalone migration: Postgres does not allow using a newly-added
-- enum value within the same transaction that added it (see migration 20260424115908
-- for the same pattern with pizzeriaTarragona / pizzeriaArrabassada).

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pizzeriaRincon';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'god';
