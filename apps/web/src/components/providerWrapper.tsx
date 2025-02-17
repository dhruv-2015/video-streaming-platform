"use client"
import { TRPCProvider } from "@/trpc/react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { store } from "@/redux/store";
import { Provider as ReduxProvider } from "react-redux";
// import { setUser } from "@/redux/features/user/userSlice";

import React from "react";
// import { trpc } from "@/trpc/client";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ReduxProvider store={store}>
      <SessionProvider>
        <ThemeProvider attribute="class" defaultTheme="system">
          <TooltipProvider delayDuration={1500}>
            <TRPCProvider>{children}</TRPCProvider>
          </TooltipProvider>
        </ThemeProvider>
      </SessionProvider>
    </ReduxProvider>
  );
};
