"use client";

import { Search, Menu, Bell, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "./ThemeModeToggle";
import { useSidebar } from "@workspace/ui/components/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

export default function Header() {
  const {toggleSidebar} = useSidebar();
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-4">
          {/* <SidebarTrigger children className="h-5 w-5" /> */}
          <Menu onClick={() => toggleSidebar()} />
        </Button>
        <Link href="/" className="text-2xl font-bold">
          MyTube
        </Link>
      </div>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="mr-4">
          {/* <SidebarTrigger children className="h-5 w-5" /> */}
          <Menu onClick={() => toggleSidebar()} />
        </Button>
        <Link href="/" className="text-2xl font-bold">
          MyTube
        </Link>
      </div>
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <Input type="text" placeholder="Search" className="w-full pl-10" />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <ModeToggle />
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
