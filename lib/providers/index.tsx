"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ConnectKitProvider from "./connectkit";
import WagmiProvider from "./wagmi";

const queryClient = new QueryClient();

const RootProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default RootProvider;
