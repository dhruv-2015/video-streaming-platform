"use client";

import { Search, Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "./ThemeModeToggle";
import Profile from "./Profile";
import { useSidebar } from "@/components/ui/sidebar";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Header() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // const search = searchParams.get("q") || "";
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const handelSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search != "") params.set("q", search);
    router.push(`/search?${params.toString()}`);
    // const search = e.currentTarget.search.value;
    // const tags = e.currentTarget.tags.value;
  };
  //     const params = new URLSearchParams();
  //     if (search) params.set("q", search);
  //     if (tags) params.set("tags", tags);
  //     router.push(`/search?${params.toString()}`);
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  return (
    <header className="flex items-center justify-between p-4 border-b w-full">
      {isMobile && (
        <Button onClick={() => setOpenMobile(!openMobile)} variant="ghost">
          <Menu className="h-5 w-5" />
          {/* <Bell className="h-5 w-5" /> */}
        </Button>
      )}
      <div className=""></div>
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <form
            action={"/search"}
            onSubmit={handelSearch}
            className="flex items-center"
          >
            <Input
              type="text"
              placeholder="Search"
              name="q"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10"
            />
            {/* <Button asChild> */}
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            {/* </Button> */}
          </form>
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
