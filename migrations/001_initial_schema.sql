-- Policies Table
CREATE TABLE
    IF NOT EXISTS policies (
        id VARCHAR(255) PRIMARY KEY,
        version VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Identities Table
CREATE TABLE
    IF NOT EXISTS identities (
        id VARCHAR(255) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Indexes for JSONB lookups (Performance)
CREATE INDEX idx_policies_data ON policies USING gin (data);

CREATE INDEX idx_identities_data ON identities USING gin (data);