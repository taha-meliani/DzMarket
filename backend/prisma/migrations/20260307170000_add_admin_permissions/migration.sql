-- Add per-admin section permissions
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "adminPermissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill existing admins with full access
UPDATE "User"
SET "adminPermissions" = ARRAY['users','products','orders','payments','verification','support','admins']::TEXT[]
WHERE "role" = 'ADMIN'
  AND COALESCE(array_length("adminPermissions", 1), 0) = 0;
