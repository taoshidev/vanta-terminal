import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { SignedTokenPermit } from "sdk/types/tokens";

export type TokenPermitsState = {
  tokenPermits: SignedTokenPermit[];
  addTokenPermit: AddTokenPermitFn;
  setIsPermitsDisabled: (disabled: boolean) => void;
  isPermitsDisabled: boolean;
  resetTokenPermits: () => void;
};

export type AddTokenPermitFn = (tokenAddress: string, spenderAddress: string, value: bigint) => Promise<void>;

const TokenPermitsContext = createContext<TokenPermitsState | undefined>(undefined);

export function useTokenPermitsContext() {
  const context = useContext(TokenPermitsContext);
  if (!context) {
    throw new Error("useTokenPermits must be used within TokenPermitsContextProvider");
  }
  return context;
}

/**
 * Simplified TokenPermitsContextProvider - token permits require wallet signing
 * which is not available with username/password authentication.
 * This provider returns stub values that indicate permits are not available.
 */
export function TokenPermitsContextProvider({ children }: { children: React.ReactNode }) {
  const [isPermitsDisabled, setIsPermitsDisabled] = useState(true);

  // Token permits are not available without wallet signing
  const addTokenPermit = useCallback(async () => {
    // No-op - permits not available without wallet
  }, []);

  const resetTokenPermits = useCallback(() => {
    // No-op
  }, []);

  const state = useMemo(
    () => ({
      isPermitsDisabled: true, // Always disabled without wallet
      setIsPermitsDisabled,
      tokenPermits: [],
      addTokenPermit,
      resetTokenPermits,
    }),
    [setIsPermitsDisabled, addTokenPermit, resetTokenPermits]
  );

  return <TokenPermitsContext.Provider value={state}>{children}</TokenPermitsContext.Provider>;
}
