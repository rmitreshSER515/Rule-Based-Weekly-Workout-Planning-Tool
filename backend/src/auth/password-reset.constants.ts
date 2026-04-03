/** Minimum time between forgot-password requests for the same account. */
export const PASSWORD_RESET_COOLDOWN_MS = 30 * 60 * 1000;

/** How long a reset token remains valid after it is issued. */
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
