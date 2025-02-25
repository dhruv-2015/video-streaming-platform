"use client";

import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "./ThemeModeToggle";
import Profile from "./Profile";
import { useSidebar } from "@/components/ui/sidebar";

export default function Header() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  return (
    <header className="flex items-center justify-between p-4 border-b w-full">
      <div className="md:hidden">
        {isMobile && (<Button onClick={() => setOpenMobile(!openMobile)} variant="ghost">
        <Menu className="h-5 w-5" />
          {/* <Bell className="h-5 w-5" /> */}
        </Button>)}
        
      </div>
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <Input type="text" placeholder="Search" className="w-full pl-10" />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <ModeToggle />
        {/* <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button> */}
        <Profile />
      </div>
    </header>
  );
}
