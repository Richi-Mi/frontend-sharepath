"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
  type Icon,
} from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavDocuments({
  items,
  label,
}: {
  items: { title?: string; url: string; icon: Icon }[];
  label?: string;
}) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            item.url !== "#" &&
            (pathname === item.url || pathname.startsWith(item.url));
          const isDisabled = item.url === "#";

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild={!isDisabled}
                isActive={isActive}
                tooltip={item.title}
                className={isDisabled ? "opacity-60 cursor-not-allowed" : ""}
              >
                {isDisabled ? (
                  <div className="flex items-center gap-2">
                    <item.icon />
                    <span>{item.title}</span>
                  </div>
                ) : (
                  <Link href={item.url} className="flex items-center gap-2">
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
