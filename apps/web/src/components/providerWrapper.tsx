import { TRPCProvider } from "@/trpc/react";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import React from "react";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system">
        
          <TRPCProvider>{children}</TRPCProvider>
        
      </ThemeProvider>
    </SessionProvider>
  );
};
