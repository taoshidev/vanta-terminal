/**
 * Stub for useEthersSigner - no longer uses wagmi since we're using username/password auth.
 * Wallet signing is not available in this authentication mode.
 */
export function useEthersSigner({ chainId: _chainId }: { chainId?: number } = {}) {
  // Return undefined since we're not using wallet-based authentication
  return undefined;
}
