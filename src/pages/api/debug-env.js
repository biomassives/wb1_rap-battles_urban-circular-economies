export async function GET() {
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    lab_POSTGRES_URL: process.env.lab_POSTGRES_URL,
    lab_NILEDB_URL: process.env.lab_NILEDB_URL,
    NODE_ENV: process.env.NODE_ENV,
    allKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('NILE'))
  };

  return new Response(JSON.stringify(envVars, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
