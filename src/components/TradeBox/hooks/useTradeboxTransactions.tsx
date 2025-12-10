import { t } from "@lingui/macro";
import { useCallback, useId, useMemo } from "react";

import { useAuth } from "context/AuthContext";
import { useSettings } from "context/SettingsContext/SettingsContextProvider";
import { useTokensData } from "context/SyntheticsStateContext/hooks/globalsHooks";
import { selectChartHeaderInfo } from "context/SyntheticsStateContext/selectors/chartSelectors";
import {
  selectBlockTimestampData,
  selectIsFirstOrder,
  selectMarketsInfoData,
} from "context/SyntheticsStateContext/selectors/globalSelectors";
import {
  selectExecutionFeeBufferBps,
  selectIsLeverageSliderEnabled,
} from "context/SyntheticsStateContext/selectors/settingsSelectors";
import {
  selectSetShouldFallbackToInternalSwap,
  selectTradeboxAllowedSlippage,
  selectTradeboxCollateralToken,
  selectTradeboxDecreasePositionAmounts,
  selectTradeboxExecutionFee,
  selectTradeboxFees,
  selectTradeboxFromToken,
  selectTradeboxIncreasePositionAmounts,
  selectTradeboxIsFromTokenGmxAccount,
  selectTradeboxMarketInfo,
  selectTradeboxPayTokenAllowance,
  selectTradeboxSelectedPosition,
  selectTradeboxSwapAmounts,
  selectTradeboxToTokenAddress,
  selectTradeboxTradeFlags,
  selectTradeboxTradeMode,
  selectTradeboxTriggerPrice,
  selectTradeboxTwapDuration,
  selectTradeboxTwapNumberOfParts,
} from "context/SyntheticsStateContext/selectors/tradeboxSelectors";
import { selectTradeBoxCreateOrderParams } from "context/SyntheticsStateContext/selectors/transactionsSelectors/tradeBoxOrdersSelectors";
import { useSelector } from "context/SyntheticsStateContext/utils";
import { useUserReferralCode } from "domain/referrals";
import { getIsValidExpressParams } from "domain/synthetics/express/expressOrderUtils";
import { useExpressOrdersParams } from "domain/synthetics/express/useRelayerFeeHandler";
import { OrderType } from "domain/synthetics/orders";
import { useOrderTxnCallbacks } from "domain/synthetics/orders/useOrderTxnCallbacks";
import { formatLeverage } from "domain/synthetics/positions/utils";
import { TradeMode } from "domain/synthetics/trade";
import tradeApi, { TradeOrderPayload } from "lib/api/tradeApi";
import { useChainId } from "lib/chains";
import { helperToast } from "lib/helperToast";
import {
  initDecreaseOrderMetricData,
  initIncreaseOrderMetricData,
  initSwapMetricData,
  sendOrderSubmittedMetric,
  sendTxnValidationErrorMetric,
} from "lib/metrics/utils";
import { formatUsd } from "lib/numbers";
import { getByKey } from "lib/objects";
import { getTradeInteractionKey, sendUserAnalyticsOrderConfirmClickEvent, userAnalytics } from "lib/userAnalytics";
import { BatchOrderTxnParams, getBatchTotalExecutionFee } from "sdk/utils/orderTransactions";

import { useSidecarOrderPayloads } from "./useSidecarOrderPayloads";

interface TradeboxTransactionsProps {
  setPendingTxns: (txns: any) => void;
}

export function useTradeboxTransactions({ setPendingTxns }: TradeboxTransactionsProps) {
  const { chainId, srcChainId } = useChainId();
  const { user, isAuthenticated } = useAuth();
  const tokensData = useTokensData();
  const { shouldDisableValidationForTesting } = useSettings();

  const { makeOrderTxnCallback } = useOrderTxnCallbacks();

  const isFirstOrder = useSelector(selectIsFirstOrder);
  const blockTimestampData = useSelector(selectBlockTimestampData);
  const isLeverageSliderEnabled = useSelector(selectIsLeverageSliderEnabled);
  const increaseAmounts = useSelector(selectTradeboxIncreasePositionAmounts);
  const swapAmounts = useSelector(selectTradeboxSwapAmounts);
  const decreaseAmounts = useSelector(selectTradeboxDecreasePositionAmounts);
  const fromToken = useSelector(selectTradeboxFromToken);
  const isFromTokenGmxAccount = useSelector(selectTradeboxIsFromTokenGmxAccount);
  const toTokenAddress = useSelector(selectTradeboxToTokenAddress);
  const marketInfo = useSelector(selectTradeboxMarketInfo);
  const collateralToken = useSelector(selectTradeboxCollateralToken);
  const tradeFlags = useSelector(selectTradeboxTradeFlags);
  const tradeMode = useSelector(selectTradeboxTradeMode);
  const { isLong, isSwap, isIncrease } = tradeFlags;
  const allowedSlippage = useSelector(selectTradeboxAllowedSlippage);
  const fees = useSelector(selectTradeboxFees);
  const chartHeaderInfo = useSelector(selectChartHeaderInfo);
  const marketsInfoData = useSelector(selectMarketsInfoData);
  const executionFeeBufferBps = useSelector(selectExecutionFeeBufferBps);
  const duration = useSelector(selectTradeboxTwapDuration);
  const numberOfParts = useSelector(selectTradeboxTwapNumberOfParts);

  const setShouldFallbackToInternalSwap = useSelector(selectSetShouldFallbackToInternalSwap);

  const selectedPosition = useSelector(selectTradeboxSelectedPosition);
  const executionFee = useSelector(selectTradeboxExecutionFee);
  const triggerPrice = useSelector(selectTradeboxTriggerPrice);
  // Pass undefined for account since we don't have a wallet address
  // Referral codes from localStorage will still work
  const { referralCodeForTxn } = useUserReferralCode(undefined, chainId, undefined);

  const toToken = getByKey(tokensData, toTokenAddress);

  const initialCollateralAllowance = useSelector(selectTradeboxPayTokenAllowance);
  const sidecarOrderPayloads = useSidecarOrderPayloads();

  const primaryCreateOrderParams = useSelector(selectTradeBoxCreateOrderParams);

  const slippageInputId = useId();

  const batchParams: BatchOrderTxnParams = useMemo(() => {
    if (!primaryCreateOrderParams) {
      return {
        createOrderParams: [],
        updateOrderParams: [],
        cancelOrderParams: [],
      };
    }

    return {
      createOrderParams: [...primaryCreateOrderParams, ...(sidecarOrderPayloads?.createPayloads ?? [])],
      updateOrderParams: sidecarOrderPayloads?.updatePayloads ?? [],
      cancelOrderParams: sidecarOrderPayloads?.cancelPayloads ?? [],
    };
  }, [primaryCreateOrderParams, sidecarOrderPayloads]);

  const totalExecutionFee = useMemo(() => {
    return tokensData ? getBatchTotalExecutionFee({ batchParams, chainId, tokensData }) : undefined;
  }, [batchParams, chainId, tokensData]);

  const {
    expressParams,
    fastExpressParams,
    asyncExpressParams,
    expressParamsPromise,
    isLoading: isExpressLoading,
  } = useExpressOrdersParams({
    orderParams: batchParams,
    label: "TradeBox",
    isGmxAccount: isFromTokenGmxAccount,
  });

  const initOrderMetricData = useCallback(() => {
    const primaryOrder = primaryCreateOrderParams?.[0];

    if (isSwap) {
      return initSwapMetricData({
        fromToken,
        toToken,
        hasReferralCode: Boolean(referralCodeForTxn),
        swapAmounts,
        isExpress: Boolean(expressParams),
        executionFee,
        allowedSlippage,
        executionFeeBufferBps,
        orderType: primaryOrder?.orderPayload.orderType,
        subaccount: expressParams?.subaccount,
        isFirstOrder,
        initialCollateralAllowance,
        isTwap: tradeMode === TradeMode.Twap,
        duration,
        partsCount: numberOfParts,
        tradeMode,
        expressParams,
        asyncExpressParams,
        fastExpressParams,
        chainId: srcChainId ?? chainId,
        isCollateralFromMultichain: isFromTokenGmxAccount,
      });
    }

    if (isIncrease) {
      return initIncreaseOrderMetricData({
        fromToken,
        increaseAmounts,
        orderPayload: primaryOrder?.orderPayload,
        hasExistingPosition: Boolean(selectedPosition),
        leverage: formatLeverage(increaseAmounts?.estimatedLeverage) ?? "",
        executionFee,
        executionFeeBufferBps,
        orderType: primaryOrder?.orderPayload.orderType ?? OrderType.MarketIncrease,
        hasReferralCode: Boolean(referralCodeForTxn),
        subaccount: expressParams?.subaccount,
        triggerPrice,
        allowedSlippage,
        marketInfo,
        isLong,
        isFirstOrder,
        isExpress: Boolean(expressParams),
        isTwap: tradeMode === TradeMode.Twap,
        isLeverageEnabled: isLeverageSliderEnabled,
        initialCollateralAllowance,
        isTPSLCreated: Boolean(sidecarOrderPayloads?.createPayloads?.length),
        slCount: sidecarOrderPayloads?.createPayloads.filter(
          (entry) => entry.orderPayload.orderType === OrderType.StopLossDecrease
        ).length,
        tpCount: sidecarOrderPayloads?.createPayloads.filter(
          (entry) => entry.orderPayload.orderType === OrderType.LimitDecrease
        ).length,
        priceImpactDeltaUsd: increaseAmounts?.positionPriceImpactDeltaUsd,
        priceImpactPercentage: fees?.increasePositionPriceImpact?.precisePercentage,
        netRate1h: isLong ? chartHeaderInfo?.fundingRateLong : chartHeaderInfo?.fundingRateShort,
        interactionId: marketInfo?.name
          ? userAnalytics.getInteractionId(getTradeInteractionKey(marketInfo.name))
          : undefined,
        duration,
        partsCount: numberOfParts,
        tradeMode: tradeMode,
        expressParams,
        asyncExpressParams,
        fastExpressParams,
        chainId: srcChainId ?? chainId,
        isCollateralFromMultichain: isFromTokenGmxAccount,
      });
    }

    return initDecreaseOrderMetricData({
      collateralToken,
      decreaseAmounts,
      hasExistingPosition: Boolean(selectedPosition),
      executionFee,
      swapPath: [],
      executionFeeBufferBps,
      orderType: primaryOrder?.orderPayload.orderType,
      hasReferralCode: Boolean(referralCodeForTxn),
      subaccount: expressParams?.subaccount,
      triggerPrice,
      marketInfo,
      allowedSlippage,
      isLong,
      place: "tradeBox",
      isExpress: Boolean(expressParams),
      isTwap: tradeMode === TradeMode.Twap,
      interactionId: marketInfo?.name ? userAnalytics.getInteractionId(getTradeInteractionKey(marketInfo.name)) : "",
      priceImpactDeltaUsd: decreaseAmounts?.totalPendingImpactDeltaUsd,
      priceImpactPercentage: fees?.decreasePositionPriceImpact?.precisePercentage,
      netRate1h: isLong ? chartHeaderInfo?.fundingRateLong : chartHeaderInfo?.fundingRateShort,
      tradeMode,
      duration,
      partsCount: numberOfParts,
      expressParams,
      asyncExpressParams,
      fastExpressParams,
      chainId: srcChainId ?? chainId,
      isCollateralFromMultichain: isFromTokenGmxAccount,
    });
  }, [
    allowedSlippage,
    asyncExpressParams,
    chainId,
    chartHeaderInfo?.fundingRateLong,
    chartHeaderInfo?.fundingRateShort,
    collateralToken,
    decreaseAmounts,
    duration,
    executionFee,
    executionFeeBufferBps,
    expressParams,
    fastExpressParams,
    fees?.decreasePositionPriceImpact?.precisePercentage,
    fees?.increasePositionPriceImpact?.precisePercentage,
    fromToken,
    increaseAmounts,
    initialCollateralAllowance,
    isFirstOrder,
    isFromTokenGmxAccount,
    isIncrease,
    isLeverageSliderEnabled,
    isLong,
    isSwap,
    marketInfo,
    numberOfParts,
    primaryCreateOrderParams,
    referralCodeForTxn,
    selectedPosition,
    sidecarOrderPayloads?.createPayloads,
    srcChainId,
    swapAmounts,
    toToken,
    tradeMode,
    triggerPrice,
  ]);

  const onSubmitOrder = useCallback(async () => {
    const metricData = initOrderMetricData();

    sendOrderSubmittedMetric(metricData.metricId);

    if (!primaryCreateOrderParams || !user || !isAuthenticated || !tokensData || !marketsInfoData) {
      helperToast.error(t`Error submitting order`);
      sendTxnValidationErrorMetric(metricData.metricId);
      return Promise.reject();
    }

    sendUserAnalyticsOrderConfirmClickEvent(chainId, metricData.metricId);

    // Build the trade order payload for the API
    const primaryOrder = primaryCreateOrderParams[0];
    const orderPayload = primaryOrder?.orderPayload;

    if (!orderPayload || !marketInfo) {
      helperToast.error(t`Invalid order parameters`);
      return Promise.reject();
    }

    // Determine order type for the API
    let apiOrderType: TradeOrderPayload["orderType"] = "market";
    const rawOrderType = orderPayload.orderType as number;
    if (rawOrderType === OrderType.LimitIncrease) {
      apiOrderType = "limit";
    } else if (rawOrderType === OrderType.StopLossDecrease) {
      apiOrderType = "stop-loss";
    } else if (rawOrderType === OrderType.LimitDecrease) {
      apiOrderType = "take-profit";
    }

    const tradePayload: TradeOrderPayload = {
      userId: user.id,
      orderType: apiOrderType,
      side: isLong ? "long" : "short",
      marketAddress: marketInfo.marketTokenAddress,
      marketSymbol: marketInfo.name,
      sizeDeltaUsd: formatUsd(increaseAmounts?.sizeDeltaUsd ?? decreaseAmounts?.sizeDeltaUsd ?? 0n) ?? "0",
      collateralDeltaUsd: formatUsd(increaseAmounts?.collateralDeltaUsd ?? decreaseAmounts?.collateralDeltaUsd ?? 0n) ?? "0",
      triggerPrice: triggerPrice ? formatUsd(triggerPrice) ?? undefined : undefined,
      acceptablePrice: formatUsd((orderPayload as any).acceptablePrice ?? 0n) ?? "0",
      leverage: increaseAmounts?.estimatedLeverage ? Number(increaseAmounts.estimatedLeverage) / 10000 : 1,
      isLong,
      chainId,
      metadata: {
        referralCode: referralCodeForTxn ?? undefined,
        slippageBps: allowedSlippage,
      },
    };

    try {
      const response = await tradeApi.submitOrder(tradePayload);

      if (response.success) {
        helperToast.success(t`Order submitted successfully`);

        // Add to pending transactions for UI tracking
        setPendingTxns((prev: any[]) => [
          ...prev,
          {
            orderId: response.orderId,
            type: apiOrderType,
            market: marketInfo.name,
            timestamp: Date.now(),
          },
        ]);

        return response;
      } else {
        throw new Error(response.error || "Order submission failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      helperToast.error(t`Order failed: ${errorMessage}`);
      sendTxnValidationErrorMetric(metricData.metricId);
      throw error;
    }
  }, [
    user,
    isAuthenticated,
    chainId,
    initOrderMetricData,
    marketsInfoData,
    primaryCreateOrderParams,
    tokensData,
    marketInfo,
    isLong,
    increaseAmounts,
    decreaseAmounts,
    triggerPrice,
    referralCodeForTxn,
    allowedSlippage,
    setPendingTxns,
  ]);

  // Wrap/Unwrap operations are now handled via API as well
  function onSubmitWrapOrUnwrap() {
    if (!user || !swapAmounts || !fromToken) {
      return Promise.reject();
    }

    // TODO: Implement wrap/unwrap via API
    helperToast.info(t`Wrap/Unwrap operations will be available soon`);
    return Promise.resolve();
  }

  // Stake/Unstake operations are now handled via API as well
  function onSubmitStakeOrUnstake() {
    if (!user || !swapAmounts || !fromToken || !toToken) {
      return Promise.reject();
    }

    // TODO: Implement stake/unstake via API
    helperToast.info(t`Stake/Unstake operations will be available soon`);
    return Promise.resolve();
  }

  return {
    onSubmitSwap: onSubmitOrder,
    onSubmitIncreaseOrder: onSubmitOrder,
    onSubmitDecreaseOrder: onSubmitOrder,
    onSubmitWrapOrUnwrap,
    onSubmitStakeOrUnstake,
    slippageInputId,
    expressParams,
    batchParams,
    isExpressLoading,
    totalExecutionFee,
  };
}
