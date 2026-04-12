// Environment variable validation
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD_HASH',
    'JWT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Warn about default JWT secret
  if (
    process.env.JWT_SECRET?.includes('change-in-production') ||
    process.env.JWT_SECRET === 'stroop-jwt-secret-change-in-production-k3p9x2m7n1q4r8w5'
  ) {
    console.warn(
      '⚠️  WARNING: Using default JWT_SECRET. Change this in production!'
    );
  }
}

// Call on module load
if (typeof window === 'undefined') {
  validateEnv();
}
