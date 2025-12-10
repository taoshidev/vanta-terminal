import type { AnyChainId, SettlementChainId } from "config/chains";
import { WalletSigner } from "lib/wallets";

/**
 * Stub for wrapChainAction - chain switching and wallet signing is not available
 * with username/password authentication. This function will throw an error.
 */
export async function wrapChainAction(
  _chainId: AnyChainId,
  _setSettlementChainId: (chainId: SettlementChainId) => void,
  _action: (signer: WalletSigner) => Promise<void>
): Promise<void> {
  throw new Error("Chain actions with wallet signing are not available with username/password authentication");
}
