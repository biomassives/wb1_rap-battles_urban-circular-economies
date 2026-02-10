export async function GET() {
  const envVars = {
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    NILE_DATABASE_URL: process.env.NILE_DATABASE_URL ? 'set' : 'missing',
    SOLANA_MINT_MODE: process.env.SOLANA_MINT_MODE || 'not set',
    SOLANA_PRIVATE_KEY: process.env.SOLANA_PRIVATE_KEY ? 'set (hidden)' : 'missing',
    NODE_ENV: process.env.NODE_ENV,
    allDbKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('NILE'))
  };

  return new Response(JSON.stringify(envVars, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
