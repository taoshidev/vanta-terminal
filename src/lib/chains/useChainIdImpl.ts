import { useEffect, useState } from "react";

import {
  type ContractsChainId,
  type SettlementChainId,
  type SourceChainId,
  ARBITRUM,
  ARBITRUM_SEPOLIA,
  isContractsChain,
} from "config/chains";
import { isDevelopment } from "config/env";
import { SELECTED_NETWORK_LOCAL_STORAGE_KEY } from "config/localStorage";
import { isSourceChain } from "config/multichain";

const IS_DEVELOPMENT = isDevelopment();

let INITIAL_CHAIN_ID: ContractsChainId;
if (IS_DEVELOPMENT) {
  INITIAL_CHAIN_ID = ARBITRUM_SEPOLIA;
} else {
  INITIAL_CHAIN_ID = ARBITRUM;
}

/**
 * This returns default chainId if chainId is not supported or not found.
 * Simplified version without wallet connection - chain is selected via UI.
 */
export function useChainIdImpl(settlementChainId: SettlementChainId): {
  chainId: ContractsChainId;
  isConnectedToChainId?: boolean;
  /**
   * Guaranteed to be related to the settlement chain in `chainId`
   */
  srcChainId?: SourceChainId;
} {
  const rawChainIdFromLocalStorage = localStorage.getItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY);
  const chainIdFromLocalStorage = rawChainIdFromLocalStorage ? parseInt(rawChainIdFromLocalStorage) : undefined;

  const [displayedChainId, setDisplayedChainId] = useState<ContractsChainId>(() => {
    if (chainIdFromLocalStorage && isContractsChain(chainIdFromLocalStorage, IS_DEVELOPMENT)) {
      return chainIdFromLocalStorage as ContractsChainId;
    }
    return settlementChainId;
  });

  // Listen for network change events from the UI
  useEffect(() => {
    const switchNetworkHandler = (switchNetworkInfo: CustomEvent<{ chainId: number }>) => {
      const newChainId = switchNetworkInfo.detail.chainId;
      if (isContractsChain(newChainId, IS_DEVELOPMENT) || isSourceChain(newChainId)) {
        setDisplayedChainId(newChainId as ContractsChainId);
        localStorage.setItem(SELECTED_NETWORK_LOCAL_STORAGE_KEY, newChainId.toString());
      }
    };
    document.addEventListener("networkChange", switchNetworkHandler as EventListener);
    return () => {
      document.removeEventListener("networkChange", switchNetworkHandler as EventListener);
    };
  }, []);

  // Update when settlement chain changes
  useEffect(() => {
    if (!chainIdFromLocalStorage || !isContractsChain(chainIdFromLocalStorage, IS_DEVELOPMENT)) {
      setDisplayedChainId(settlementChainId);
    }
  }, [settlementChainId, chainIdFromLocalStorage]);

  return {
    chainId: displayedChainId,
    isConnectedToChainId: true, // Always "connected" since we're not using a wallet
    srcChainId: undefined,
  };
}
