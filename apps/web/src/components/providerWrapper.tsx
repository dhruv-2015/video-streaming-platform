import { TRPCProvider } from "@/trpc/react";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import React from "react";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class">
        <SidebarProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </SidebarProvider>
      </ThemeProvider>
    </SessionProvider>
  );
};
