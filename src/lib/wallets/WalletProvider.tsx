import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { AuthProvider } from "context/AuthContext";

import { getHeadlessWagmiConfig } from "./headlessWagmiConfig";

const queryClient = new QueryClient();

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={getHeadlessWagmiConfig()}>
        <AuthProvider>{children}</AuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

// Keep this wrapper for compatibility - now just passes children through
export function RainbowKitProviderWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
