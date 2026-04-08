-- Generate slugs for existing clients
-- Run this SQL directly in your database

-- Update Client slugs
UPDATE "Client" 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRIM("companyName"),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Update Branch slugs
UPDATE "Branch" 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRIM(name),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Handle duplicates by appending numbers
-- This is a simplified version - you may need to run this multiple times
-- or handle manually if there are many duplicates

SELECT * FROM "Client" WHERE slug IS NOT NULL ORDER BY slug;
SELECT * FROM "Branch" WHERE slug IS NOT NULL ORDER BY "clientId", slug;
