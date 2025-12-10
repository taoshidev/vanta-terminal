import { t } from "@lingui/macro";
import { useMemo } from "react";

import { useAuth } from "context/AuthContext";
import { selectChainId } from "context/SyntheticsStateContext/selectors/globalSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { ExecutionFee } from "domain/synthetics/fees";
import type { GlvOrMarketInfo, MarketInfo } from "domain/synthetics/markets/types";
import type { TokenData, TokensData } from "domain/synthetics/tokens/types";
import type { ShiftAmounts } from "domain/synthetics/trade/utils/shift";
import { getCommonError, getGmShiftError } from "domain/synthetics/trade/utils/validation";
import { useHasOutdatedUi } from "lib/useHasOutdatedUi";
import type { GmSwapFees } from "sdk/types/trade";

import { useShiftTransactions } from "./useShiftTransactions";

export function useShiftSubmitState({
  amounts,
  executionFee,
  fees,
  marketTokenUsd,
  payTokenAddresses,
  routerAddress,
  selectedMarketInfo,
  selectedToken,
  shouldDisableValidationForTesting,
  tokensData,
  toMarketInfo,
  toToken,
  glvOrMarketInfoData,
}: {
  amounts: ShiftAmounts | undefined;
  executionFee: ExecutionFee | undefined;
  fees: GmSwapFees | undefined;
  marketTokenUsd: bigint | undefined;
  payTokenAddresses: string[];
  routerAddress: string;
  selectedMarketInfo: MarketInfo | undefined;
  selectedToken: TokenData | undefined;
  shouldDisableValidationForTesting: boolean;
  tokensData: TokensData | undefined;
  toMarketInfo: MarketInfo | undefined;
  toToken: TokenData | undefined;
  glvOrMarketInfoData: { [key: string]: GlvOrMarketInfo } | undefined;
}) {
  const chainId = useSelector(selectChainId);
  const hasOutdatedUi = useHasOutdatedUi();
  const { isAuthenticated } = useAuth();

  const { isSubmitting, onSubmit } = useShiftTransactions({
    fromMarketToken: selectedToken,
    fromMarketTokenAmount: amounts?.fromTokenAmount,
    fromMarketTokenUsd: amounts?.fromTokenUsd,
    marketToken: toToken,
    marketTokenAmount: amounts?.toTokenAmount,
    shouldDisableValidation: shouldDisableValidationForTesting,
    tokensData,
    executionFee,
    marketTokenUsd,
  });

  return useMemo(() => {
    if (isSubmitting) {
      return {
        text: t`Submitting...`,
        disabled: true,
      };
    }

    if (!isAuthenticated) {
      return {
        text: t`Sign In`,
        onSubmit: () => {},
      };
    }

    const commonError = getCommonError({
      chainId,
      isConnected: true,
      hasOutdatedUi,
    })[0];

    const shiftError = getGmShiftError({
      fromMarketInfo: selectedMarketInfo,
      fromToken: selectedToken,
      fromTokenAmount: amounts?.fromTokenAmount,
      fromTokenUsd: amounts?.fromTokenUsd,
      fromLongTokenAmount: amounts?.fromLongTokenAmount,
      fromShortTokenAmount: amounts?.fromShortTokenAmount,
      toMarketInfo: toMarketInfo,
      toToken: toToken,
      toTokenAmount: amounts?.toTokenAmount,
      fees,
      priceImpactUsd: amounts?.swapPriceImpactDeltaUsd,
    })[0];

    const error = commonError || shiftError;

    if (error) {
      return {
        text: error,
        error,
        disabled: !shouldDisableValidationForTesting,
        onSubmit,
      };
    }

    // Token approvals are no longer needed with API-based submission

    return {
      text: t`Shift GM`,
      onSubmit,
    };
  }, [
    isSubmitting,
    isAuthenticated,
    chainId,
    hasOutdatedUi,
    selectedMarketInfo,
    selectedToken,
    amounts?.fromTokenAmount,
    amounts?.fromTokenUsd,
    amounts?.fromLongTokenAmount,
    amounts?.fromShortTokenAmount,
    amounts?.toTokenAmount,
    amounts?.swapPriceImpactDeltaUsd,
    toMarketInfo,
    toToken,
    fees,
    onSubmit,
    shouldDisableValidationForTesting,
  ]);
}
