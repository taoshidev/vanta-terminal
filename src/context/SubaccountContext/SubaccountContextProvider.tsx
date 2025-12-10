import React, { createContext, useContext, useMemo } from "react";

import type { Subaccount, SubaccountSerializedConfig } from "domain/synthetics/subaccount/types";

enum SubaccountActivationState {
  Generating = 0,
  GeneratingError = 1,
  ApprovalSigning = 2,
  ApprovalSigningError = 3,
  Success = 4,
}

enum SubaccountDeactivationState {
  Deactivating = 0,
  Error = 1,
  Success = 2,
}

export type SubaccountState = {
  subaccountConfig: SubaccountSerializedConfig | undefined;
  subaccount: Subaccount | undefined;
  subaccountActivationState: SubaccountActivationState | undefined;
  subaccountDeactivationState: SubaccountDeactivationState | undefined;
  updateSubaccountSettings: (params: {
    nextRemainigActions?: bigint;
    nextRemainingSeconds?: bigint;
    nextIsGmxAccount?: boolean;
  }) => Promise<boolean>;
  resetSubaccountApproval: () => void;
  tryEnableSubaccount: () => Promise<boolean>;
  tryDisableSubaccount: () => Promise<boolean>;
  refreshSubaccountData: () => void;
};

const SubaccountContext = createContext<SubaccountState | undefined>(undefined);

export function useSubaccountContext() {
  const context = useContext(SubaccountContext);
  if (!context) {
    throw new Error("useSubaccount must be used within SubaccountContextProvider");
  }
  return context;
}

/**
 * Simplified SubaccountContextProvider - subaccounts (1-click trading) require wallet signing
 * which is not available with username/password authentication.
 * This provider returns stub values that indicate subaccounts are not available.
 */
export function SubaccountContextProvider({ children }: { children: React.ReactNode }) {
  const state: SubaccountState = useMemo(
    () => ({
      subaccountConfig: undefined,
      subaccount: undefined,
      subaccountActivationState: undefined,
      subaccountDeactivationState: undefined,
      updateSubaccountSettings: async () => false,
      resetSubaccountApproval: () => {},
      tryEnableSubaccount: async () => false,
      tryDisableSubaccount: async () => false,
      refreshSubaccountData: () => {},
    }),
    []
  );

  return <SubaccountContext.Provider value={state}>{children}</SubaccountContext.Provider>;
}
