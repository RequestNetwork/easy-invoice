export function isBuildTime(): boolean {
  return (
    process.env.SKIP_ENV_VALIDATION === "true" || process.env.CI === "true"
  );
}
