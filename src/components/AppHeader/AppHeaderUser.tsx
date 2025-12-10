import { Trans } from "@lingui/macro";
import { useState } from "react";

import { NETWORK_OPTIONS } from "config/networkOptions";
import { useAuth } from "context/AuthContext";
import { useChainId } from "lib/chains";
import { sendUserAnalyticsConnectWalletClickEvent } from "lib/userAnalytics";

import { AuthModal } from "components/AuthModal";
import Button from "components/Button/Button";
import { OneClickButton } from "components/OneClickButton/OneClickButton";
import { UserDropdown } from "components/UserDropdown";

import NetworkDropdown from "../NetworkDropdown/NetworkDropdown";

import UserIcon from "img/ic_wallet.svg?react";

type Props = {
  openSettings: () => void;
  menuToggle?: React.ReactNode;
};

export function AppHeaderUser({ openSettings, menuToggle }: Props) {
  const { chainId: settlementChainId, srcChainId } = useChainId();
  const { isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const visualChainId = srcChainId ?? settlementChainId;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-8">
        <Button
          variant="primary"
          size="controlled"
          data-qa="sign-in-button"
          className="flex h-40 items-center gap-6 max-md:h-32"
          onClick={() => {
            sendUserAnalyticsConnectWalletClickEvent("Header");
            setIsAuthModalOpen(true);
          }}
        >
          <UserIcon className="box-content size-20" />
          <span>
            <Trans>Sign In</Trans>
          </span>
        </Button>
        <OneClickButton openSettings={openSettings} />
        <NetworkDropdown chainId={visualChainId} networkOptions={NETWORK_OPTIONS} openSettings={openSettings} />
        {menuToggle ? menuToggle : null}
        <AuthModal isVisible={isAuthModalOpen} setIsVisible={setIsAuthModalOpen} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-8">
      <div data-qa="user-info">
        <UserDropdown />
      </div>
      <OneClickButton openSettings={openSettings} />
      <NetworkDropdown chainId={visualChainId} networkOptions={NETWORK_OPTIONS} openSettings={openSettings} />
      {menuToggle ? menuToggle : null}
    </div>
  );
}
