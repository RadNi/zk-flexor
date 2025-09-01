"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
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
                height: "34px", // slightly smaller
              }}
            />
          );
        }

        const baseButtonClasses =
          "flex items-center gap-1 px-3 h-8 rounded-full text-xs font-medium transition-colors border border-transparent cursor-pointer select-none";

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
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            {!connected ? (
              <button onClick={openConnectModal} className={connectButtonClasses}>
                Connect Wallet
              </button>
            ) : (
              <>
                {/* Wrap network and account info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <button onClick={openChainModal} className={chainButtonClasses}>
                    {chain.hasIcon && chain.iconUrl && (
                      <Image
                        src={chain.iconUrl ?? '/fallback-icon.png'}
                        alt={chain.name ?? 'Chain icon'}
                        width={16}
                        height={16}
                        style={{
                          borderRadius: '9999px',
                          background: chain.iconBackground,
                          marginRight: 4,
                          verticalAlign: 'middle',
                        }}
                      />
                    )}
                    {chain.name}
                  </button>
                  <button onClick={openAccountModal} className={accountButtonClasses}>
                    {account.displayName}
                    {account.displayBalance ? ` (${account.displayBalance})` : ""}
                  </button>
                </div>
              </>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
