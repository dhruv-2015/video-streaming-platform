"use client";

import { Home, Compass, Clock, ThumbsUp, History, Video } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";

export default function SidebarCom() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>


        </SidebarGroupLabel> */}
          <SidebarGroupContent>
            {/* <nav className="space-y-2">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link prefetch href="/">
            <History className="mr-2 h-4 w-4" />
            History
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link prefetch href="/">
            <Clock className="mr-2 h-4 w-4" />
            Watch later
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link prefetch href="/">
            <ThumbsUp className="mr-2 h-4 w-4" />
            Liked Videos
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link prefetch href="/">
            <Video className="mr-2 h-4 w-4" />
            Your Videos
          </Link>
        </Button>
      </nav>
      <Separator />
      <nav className="space-y-2">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link prefetch href="/about">About Us</Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link prefetch href="/contact">Contact Us</Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link prefetch href="/privacy">Privacy Policy</Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link prefetch href="/tos">Terms of Service</Link>
        </Button>
      </nav> */}
            <SidebarMenuItem >
              <SidebarMenuButton asChild>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenu></SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
