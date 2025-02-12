import { TRPCProvider } from "@/trpc/react";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import {TooltipProvider} from "@/components/ui/tooltip"
import React from "react";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system">
        <TooltipProvider delayDuration={1500}>

          <TRPCProvider>{children}</TRPCProvider>
        </TooltipProvider>
        
      </ThemeProvider>
    </SessionProvider>
  );
};
