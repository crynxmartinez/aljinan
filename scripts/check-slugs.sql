-- Check if slugs exist for clients and branches
SELECT id, "companyName", slug FROM "Client";
SELECT id, name, slug, "clientId" FROM "Branch";
