import { Menu } from "@headlessui/react";
import { Trans } from "@lingui/macro";
import cx from "classnames";

import { useAuth } from "context/AuthContext";
import { useBreakpoints } from "lib/useBreakpoints";

import Button from "components/Button/Button";

import ChevronDownIcon from "img/ic_chevron_down.svg?react";
import DisconnectIcon from "img/ic_sign_out_20.svg?react";
import UserIcon from "img/ic_wallet.svg?react";

import "./UserDropdown.scss";

export function UserDropdown() {
  const { user, logout } = useAuth();
  const { isMobile } = useBreakpoints();

  if (!user) {
    return null;
  }

  const displayName = user.username.length > 15 ? `${user.username.slice(0, 12)}...` : user.username;

  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <Menu.Button as="div">
            <Button variant="secondary" className="flex items-center gap-8 px-15 pr-12">
              <UserIcon className={cx("size-20", { "size-16": isMobile })} />

              <span className="text-body-medium font-medium text-typography-primary">{displayName}</span>

              <ChevronDownIcon className={cx("block size-20", { "rotate-180": open })} />
            </Button>
          </Menu.Button>

          <Menu.Items as="div" className="user-menu-items">
            <Menu.Item>
              <div className="user-menu-header">
                <span className="user-menu-label">
                  <Trans>Signed in as</Trans>
                </span>
                <span className="user-menu-username">{user.username}</span>
                {user.email && <span className="user-menu-email">{user.email}</span>}
              </div>
            </Menu.Item>
            <Menu.Item>
              <div className="user-menu-item" onClick={logout}>
                <DisconnectIcon width={20} className="size-20" />
                <p>
                  <Trans>Sign Out</Trans>
                </p>
              </div>
            </Menu.Item>
          </Menu.Items>
        </>
      )}
    </Menu>
  );
}
