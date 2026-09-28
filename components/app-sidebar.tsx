"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Scissors,
  Users,
  UserCog,
  FileText,
  PiggyBank,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const menuGroups = [
  {
    label: "Utama",
    items: [{ title: "Dashboard", url: "/", icon: Home }],
  },
  {
    label: "Data Master",
    items: [
      { title: "Manajemen Katalog", url: "/katalog", icon: Scissors },
      { title: "Manajemen Barber", url: "/barber", icon: Users },
      { title: "Manajemen User", url: "/kasir", icon: UserCog },
    ],
  },
  {
    label: "Laporan",
    items: [{ title: "Laporan", url: "/laporan", icon: FileText }],
  },
  {
    label: "Keuangan",
    items: [{ title: "Tabungan", url: "/tabungan", icon: PiggyBank }],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Sidebar className="border-r border-slate-200/80 bg-white font-sans text-slate-800">
      {/* Header Sidebar */}
      <SidebarHeader className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3138E8] flex items-center justify-center text-white font-black shadow-sm">
            <Scissors className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-slate-900 leading-none">
              Rafel Pangkas Rambut
            </span>
            <span className="text-[10px] font-bold text-[#3138E8] tracking-widest uppercase mt-0.5">
              POS SYSTEM
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigasi Utama */}
      <SidebarContent className="px-3 py-2 space-y-1">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="px-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-1">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.url;
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        isActive={isActive}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                          isActive
                            ? "!bg-[#3138E8] !text-white font-bold"
                            : "text-slate-600 hover:!bg-slate-100 hover:!text-slate-900"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? "!text-white" : "text-slate-500"
                          }`}
                        />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer Sidebar / Sign Out */}
      <SidebarFooter className="p-3 border-t border-slate-100">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs text-rose-600 hover:bg-rose-50 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
