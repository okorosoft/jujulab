export function shouldResetCredits(lastReset?: string) {
  if (!lastReset) return true;

  const last = new Date(lastReset);
  const now = new Date();

  return (
    now.getUTCFullYear() !== last.getUTCFullYear() ||
    now.getUTCMonth() !== last.getUTCMonth()
  );
}