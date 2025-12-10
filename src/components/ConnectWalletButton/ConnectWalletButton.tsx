import { ReactNode } from "react";

import Button from "components/Button/Button";

import UserIcon from "img/ic_wallet.svg?react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
};

/**
 * Generic auth button component.
 * Previously used for wallet connection, now used for username/password auth.
 */
export default function ConnectWalletButton({ children, onClick }: Props) {
  return (
    <Button
      variant="primary"
      size="controlled"
      data-qa="sign-in-button"
      className="flex h-40 items-center gap-6 max-md:h-32"
      onClick={onClick}
    >
      <UserIcon className="box-content size-20" />
      <span>{children}</span>
    </Button>
  );
}
