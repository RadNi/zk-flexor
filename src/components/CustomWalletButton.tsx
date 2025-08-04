"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import React from "react";

export default function CustomWalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        if (!ready) {
          return (
            <div
              aria-hidden="true"
              style={{
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
                height: "38px", // reserve height to avoid layout jump
              }}
            />
          );
        }

        const baseButtonClasses =
          "flex items-center gap-1 px-4 h-9 rounded-full text-sm font-medium transition-colors border border-transparent cursor-pointer select-none";

        const connectButtonClasses =
          baseButtonClasses +
          " bg-transparent border border-[#66fcf1] text-[#66fcf1] hover:bg-[#66fcf1] hover:text-black";

        const chainButtonClasses =
          baseButtonClasses +
          " bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-700";

        const accountButtonClasses =
          baseButtonClasses +
          " bg-gray-900 text-white hover:bg-gray-800 border border-gray-700";

        return (
          <div className="flex items-center gap-2">
            {!connected ? (
              <button onClick={openConnectModal} className={connectButtonClasses}>
                Connect Wallet
              </button>
            ) : (
              <>
                <button onClick={openChainModal} className={chainButtonClasses}>
                  {chain.hasIcon && chain.iconUrl && (
                    <img
                      src={chain.iconUrl}
                      alt={chain.name ?? "Chain icon"}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 9999,
                        background: chain.iconBackground,
                        marginRight: 6,
                        verticalAlign: "middle",
                      }}
                    />
                  )}
                  {chain.name}
                </button>
                <button onClick={openAccountModal} className={accountButtonClasses}>
                  {account.displayName}
                  {account.displayBalance ? ` (${account.displayBalance})` : ""}
                </button>
              </>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
