// Test stand-in for `next/cache`. No caching: every call reaches the providers, which in
// tests are the recorded fixtures behind a fail-closed network stub.
export function unstable_cache(fn) {
  return (...args) => fn(...args);
}
export function revalidateTag() {}
export function revalidatePath() {}
