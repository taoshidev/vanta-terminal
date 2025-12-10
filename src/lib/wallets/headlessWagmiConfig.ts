/**
 * Headless Wagmi configuration for read-only blockchain data (market data, token info, etc.)
 * This config has no wallet connectors - it's only used for public RPC calls.
 */
import once from "lodash/once";
import { createConfig, http } from "wagmi";
import { arbitrum, arbitrumSepolia, avalanche, avalancheFuji, base, bsc, optimismSepolia, sepolia } from "wagmi/chains";

import { botanix } from "config/chains";
import { isDevelopment } from "config/env";

export const getHeadlessWagmiConfig = once(() =>
  createConfig({
    chains: [
      arbitrum,
      avalanche,
      botanix,
      base,
      bsc,
      ...(isDevelopment() ? [avalancheFuji, arbitrumSepolia, optimismSepolia, sepolia] : []),
    ],
    transports: {
      [arbitrum.id]: http(),
      [avalanche.id]: http(),
      [avalancheFuji.id]: http(),
      [arbitrumSepolia.id]: http(),
      [base.id]: http(),
      [optimismSepolia.id]: http(),
      [sepolia.id]: http(),
      [botanix.id]: http(),
      [bsc.id]: http(),
    },
    // No connectors - this is read-only for market data
  })
);
