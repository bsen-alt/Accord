-- migrations/001_v13_versioning.sql

-- 1. Add a created_at timestamp if it doesn't exist (tracking order)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'policies' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE policies ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;

-- 2. Remove the old unique constraint on 'id' (if present) to allow multiple versions
-- Note: Constraint names vary by DB. We drop the primary key and recreate it.
ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_pkey;

-- 3. Create a new Primary Key on (id, version) to allow history
-- If you used 'id' as PK before, this now becomes a composite key or we use a surrogate key.
-- For v1.3, we rely on 'id' + 'created_at' for uniqueness, but we need to lookup latest efficiently.
ALTER TABLE policies ADD PRIMARY KEY (id, version);

-- 4. Create index for fast "Latest Version" lookups
CREATE INDEX IF NOT EXISTS idx_policies_id_created_at ON policies (id DESC, created_at DESC);