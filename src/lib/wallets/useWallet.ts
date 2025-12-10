import { useAuth } from "context/AuthContext";

// Legacy type exports for backwards compatibility - stub type with optional methods
export type WalletClient = {
  watchAsset?: (params: { type: string; options: { address: string; symbol: string; decimals: number; image?: string } }) => Promise<boolean>;
} | undefined;

export default function useWallet() {
  const { user, isAuthenticated } = useAuth();

  return {
    // No wallet address - we use username/password auth, not wallet auth
    // This prevents blockchain queries from using an invalid address
    account: undefined as string | undefined,
    active: isAuthenticated,
    // These are no longer needed for the new auth system
    connector: undefined as any,
    chainId: undefined as number | undefined,
    signer: undefined as any,
    connectorClient: undefined as any,
    walletClient: undefined as WalletClient,
    // Expose user info for display
    username: user?.username,
    // User ID for API calls (not an Ethereum address)
    userId: user?.id,
  };
}
