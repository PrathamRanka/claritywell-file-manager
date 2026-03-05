export function validateEnv() {
  const requiredVars = [
    'SUPABASE_S3_REGION',
    'SUPABASE_S3_ENDPOINT',
    'SUPABASE_S3_ACCESS_KEY_ID',
    'SUPABASE_S3_SECRET_ACCESS_KEY',
    'SUPABASE_S3_BUCKET_NAME',
  ];

  for (const v of requiredVars) {
    if (!process.env[v]) {
      throw new Error(`Missing environment variable: ${v}`);
    }
  }
}

// Validate environment variables on startup/import
validateEnv();

export const env = {
  SUPABASE_S3_REGION: process.env.SUPABASE_S3_REGION || 'auto',
  SUPABASE_S3_ENDPOINT: process.env.SUPABASE_S3_ENDPOINT!,
  SUPABASE_S3_ACCESS_KEY_ID: process.env.SUPABASE_S3_ACCESS_KEY_ID!,
  SUPABASE_S3_SECRET_ACCESS_KEY: process.env.SUPABASE_S3_SECRET_ACCESS_KEY!,
  SUPABASE_S3_BUCKET_NAME: process.env.SUPABASE_S3_BUCKET_NAME!,
};
