export function safeGuard(): void {
  const { STEERING_LOG_INTERNAL_RUN } = process.env;

  if (STEERING_LOG_INTERNAL_RUN === '1') {
    process.exit(0);
  }
}
