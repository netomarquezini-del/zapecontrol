"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileEdit,
  Target,
  Users,
  Zap,
  Menu,
  X,
  Briefcase,
  ChevronDown,
  BarChart3,
  Shield,
  LogOut,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  external?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: typeof Briefcase;
  children: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "comercial",
    label: "Comercial",
    icon: Briefcase,
    children: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/acompanhamento", label: "Acompanhamento", icon: BarChart3 },
      { href: "/lancamentos-ext", label: "Lancamentos", icon: FileEdit, external: true },
      { href: "/metas", label: "Metas", icon: Target },
      { href: "/cadastros", label: "Cadastros", icon: Users },
    ],
  },
  {
    id: "configuracoes",
    label: "Configuracoes",
    icon: Shield,
    children: [
      { href: "/usuarios", label: "Usuarios", icon: Users },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ comercial: true });

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/" || pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-5 left-5 z-50 flex h-10 w-10 items-center justify-center rounded-xl bg-[#111111] border border-[#222222] text-zinc-400 hover:text-white hover:border-lime-400/20 transition-all lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-screen w-[260px] flex-col
          border-r border-[#222222] bg-[#0a0a0a]
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex h-[72px] items-center justify-between px-6 border-b border-[#222222]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15 group-hover:bg-lime-400/12 group-hover:border-lime-400/25 transition-all duration-300">
              <Zap size={16} className="text-lime-400" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-extrabold text-white tracking-tight">
                ZAPE
              </span>
              <span className="text-sm font-thin text-zinc-600 tracking-tight">
                control
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:text-white transition-colors lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navGroups.map((group) => {
            const isOpen = openGroups[group.id] ?? false;
            const hasActiveChild = group.children.some((c) => isActive(c.href));

            return (
              <div key={group.id}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`
                    w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold
                    transition-all duration-200 cursor-pointer
                    ${
                      hasActiveChild
                        ? "text-lime-400"
                        : "text-zinc-500 hover:text-zinc-200"
                    }
                  `}
                >
                  <group.icon size={17} strokeWidth={1.5} />
                  {group.label}
                  <ChevronDown
                    size={14}
                    className={`ml-auto transition-transform duration-200 ${
                      isOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>

                {/* Submenu items */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="ml-3 pl-3 border-l border-[#222222] space-y-0.5 mt-1 mb-2">
                    {group.children.map((item) => {
                      const active = !item.external && isActive(item.href);
                      const cls = `
                        flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold
                        transition-all duration-200
                        ${
                          active
                            ? "bg-lime-400/8 text-lime-400 border border-lime-400/15 shadow-[0_0_20px_rgba(163,230,53,0.04)]"
                            : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
                        }
                      `;

                      if (item.external) {
                        return (
                          <a
                            key={item.href}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileOpen(false)}
                            className={cls}
                          >
                            <item.icon size={15} strokeWidth={1.5} />
                            {item.label}
                            <div className="ml-auto text-[9px] font-bold text-zinc-700 uppercase tracking-wider">nova aba</div>
                          </a>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cls}
                        >
                          <item.icon size={15} strokeWidth={active ? 2 : 1.5} />
                          {item.label}
                          {active && (
                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.5)]" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[#222222] px-4 py-4 space-y-2">
          <button
            onClick={async () => {
              const { getSupabase } = await import("@/lib/supabase");
              await getSupabase().auth.signOut();
              window.location.href = "/login";
            }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-semibold text-zinc-600 hover:text-red-400 hover:bg-red-400/5 border border-transparent transition-all cursor-pointer"
          >
            <LogOut size={14} /> Sair
          </button>
          <p className="text-[10px] font-semibold text-zinc-700 tracking-widest uppercase px-3">
            ZapeControl v2.0
          </p>
        </div>
      </aside>
    </>
  );
}
