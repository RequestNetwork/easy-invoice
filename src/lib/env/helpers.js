export function shouldSkipValidation() {
  return process.env.SKIP_ENV_VALIDATION === "true";
}
