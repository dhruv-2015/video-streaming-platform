"use client";

import * as React from "react";
import { Clock, History, Home, Menu, ThumbsUp, Video,MonitorPlay, Plus,  } from "lucide-react";

// import { NavMain } from "@/components/nav-main";
// import { NavProjects } from "@/components/nav-projects";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";

import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
// This is sample data.

export function AppSidebar() {

  const { toggleSidebar,setOpen } = useSidebar();
  // React.useEffect(() => {setOpen(false);},[]);

  return (
    <Sidebar collapsible="icon" >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Toggle"
              variant={"ghost"}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              asChild
            >
              <div>
                <Button
                  onClick={() => toggleSidebar()}
                  className="size-0 pt-3 pb-3 cursor-pointer"
                  variant={"ghost"}
                  asChild
                >
                  <div>
                    <Menu className="mr-4 h-4 w-4" />
                  </div>
                </Button>
                <span>
                  <Link href="/" className="text-2xl font-bold">
                    MyTube
                  </Link>
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Video Streaming Platform</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Home" asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton tooltip="History" asChild>
                <Link href="/">
                  <History className="mr-2 h-4 w-4" />
                  <span>History</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {/* <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Playlists</SidebarGroupLabel> */}
            {/* <SidebarMenu> */}
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Playlist" asChild>
                  <Link href="/playlist">
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Playlists</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            {/* </SidebarMenu> */}
          {/* </SidebarGroup> */}

            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Watch later" asChild>
                <Link href="/">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Watch later</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Liked Videos" asChild>
                <Link href="/">
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  <span>Liked Videos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Creaters</SidebarGroupLabel>
          <SidebarMenu>
          <SidebarMenuItem>
              <SidebarMenuButton tooltip="Home" asChild>
                <Link href="/studio">
                  <MonitorPlay className="mr-2 h-4 w-4" />
                  <span>Channel</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Your Videos" asChild>
                <Link href="/studio/video">
                  <Video className="mr-2 h-4 w-4" />
                  <span>Your Videos</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Other links</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="About Us" asChild>
                <Link prefetch href="/about">
                  <span>About Us</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Contact Us" asChild>
                <Link prefetch href="/contact">
                  <span>Contact Us</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Privacy Policy" asChild>
                <Link prefetch href="/privacy">
                  <span>Privacy Policy</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Terms of Service" asChild>
                <Link prefetch href="/tos">
                  <span>Terms of Service</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
