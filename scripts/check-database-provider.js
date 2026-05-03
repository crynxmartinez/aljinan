// Quick script to identify your database provider
// Run this locally: node scripts/check-database-provider.js

const databaseUrl = process.env.DATABASE_URL || '';

console.log('\n🔍 DATABASE PROVIDER DETECTION\n');
console.log('DATABASE_URL (first 50 chars):', databaseUrl.substring(0, 50) + '...');

// Detect provider
if (databaseUrl.includes('neon.tech')) {
  console.log('\n✅ Provider: NEON');
  console.log('\n📋 STEPS TO GET POOLED URL:');
  console.log('1. Go to: https://console.neon.tech/');
  console.log('2. Select your project');
  console.log('3. Go to "Connection Details"');
  console.log('4. Toggle "Pooled connection"');
  console.log('5. Copy the connection string');
  console.log('6. It should have port :6543 or ?pgbouncer=true');
  console.log('\n📝 Then add to Vercel:');
  console.log('   Name: DATABASE_URL_POOLED');
  console.log('   Value: <your-pooled-connection-string>');
} else if (databaseUrl.includes('supabase')) {
  console.log('\n✅ Provider: SUPABASE');
  console.log('\n📋 STEPS TO GET POOLED URL:');
  console.log('1. Go to: https://app.supabase.com/');
  console.log('2. Select your project');
  console.log('3. Go to Settings → Database');
  console.log('4. Find "Connection pooling" section');
  console.log('5. Copy the "Connection string" under pooling');
  console.log('6. It should have port :6543');
  console.log('\n📝 Then add to Vercel:');
  console.log('   Name: DATABASE_URL_POOLED');
  console.log('   Value: <your-pooled-connection-string>');
} else if (databaseUrl.includes('railway.app')) {
  console.log('\n✅ Provider: RAILWAY');
  console.log('\n📋 STEPS TO GET POOLED URL:');
  console.log('1. Go to: https://railway.app/');
  console.log('2. Select your project');
  console.log('3. Click on your Postgres service');
  console.log('4. Go to "Variables" tab');
  console.log('5. Look for DATABASE_URL or PGBOUNCER_URL');
  console.log('6. If no pooling, you may need to add PgBouncer plugin');
  console.log('\n📝 Then add to Vercel:');
  console.log('   Name: DATABASE_URL_POOLED');
  console.log('   Value: <your-pooled-connection-string>');
} else if (databaseUrl.includes('render.com')) {
  console.log('\n✅ Provider: RENDER');
  console.log('\n⚠️  Render does not provide built-in connection pooling');
  console.log('\n📋 OPTIONS:');
  console.log('1. Use Prisma Accelerate (recommended)');
  console.log('2. Set up PgBouncer manually');
  console.log('3. Switch to Neon or Supabase');
} else if (databaseUrl.includes('amazonaws.com')) {
  console.log('\n✅ Provider: AWS RDS');
  console.log('\n⚠️  AWS RDS requires manual PgBouncer setup');
  console.log('\n📋 OPTIONS:');
  console.log('1. Use Prisma Accelerate (easiest)');
  console.log('2. Set up RDS Proxy');
  console.log('3. Switch to Neon or Supabase');
} else {
  console.log('\n❓ Provider: UNKNOWN');
  console.log('\nYour DATABASE_URL host:', databaseUrl.split('@')[1]?.split('/')[0] || 'unknown');
  console.log('\n📋 RECOMMENDED ACTION:');
  console.log('1. Check your database provider dashboard');
  console.log('2. Look for "Connection Pooling" or "PgBouncer" option');
  console.log('3. Or use Prisma Accelerate: https://www.prisma.io/data-platform/accelerate');
}

console.log('\n🔗 VERCEL SETUP:');
console.log('1. Go to: https://vercel.com/crynxmartinez/aljinan/settings/environment-variables');
console.log('2. Click "Add New"');
console.log('3. Name: DATABASE_URL_POOLED');
console.log('4. Value: <your-pooled-connection-string>');
console.log('5. Select all environments (Production, Preview, Development)');
console.log('6. Click "Save"');
console.log('7. Redeploy: https://vercel.com/crynxmartinez/aljinan/deployments');
console.log('\n');
