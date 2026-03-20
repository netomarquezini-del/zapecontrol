"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-guard";
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
  KeyRound,
  Loader2,
  Check,
  AlertCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  external?: boolean;
  perm?: string; // permission ID required
}

interface NavGroup {
  id: string;
  label: string;
  icon: typeof Briefcase;
  children: NavItem[];
  perm?: string; // if set, whole group requires this perm
}

const navGroups: NavGroup[] = [
  {
    id: "comercial",
    label: "Comercial",
    icon: Briefcase,
    children: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard" },
      { href: "/acompanhamento", label: "Acompanhamento", icon: BarChart3, perm: "acompanhamento" },
      { href: "/lancamentos-ext", label: "Lancamentos", icon: FileEdit, external: true, perm: "lancamentos" },
      { href: "/metas", label: "Metas", icon: Target, perm: "metas" },
      { href: "/cadastros", label: "Cadastros", icon: Users, perm: "cadastros" },
    ],
  },
  {
    id: "configuracoes",
    label: "Configuracoes",
    icon: Shield,
    children: [
      { href: "/usuarios", label: "Usuarios", icon: Users, perm: "usuarios" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { permissions, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ comercial: true });

  // Filter nav items by permission
  // Filter nav items by permission. Items without perm are always visible.
  const filteredGroups = navGroups.map((group) => ({
    ...group,
    children: group.children.filter((item) => {
      if (isAdmin) return true;
      if (!item.perm) return true;
      return permissions.includes(item.perm);
    }),
  })).filter((group) => group.children.length > 0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwFeedback, setPwFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const isActive = (href: string) => {
    return pathname === href;
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
          fixed top-0 left-0 z-50 flex h-screen flex-col
          border-r border-[#222222] bg-[#0a0a0a]
          transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${collapsed ? "w-[68px]" : "w-[260px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className={`flex h-[72px] items-center border-b border-[#222222] ${collapsed ? "justify-center px-2" : "justify-between px-6"}`}>
          <Link href="/inicio" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-lime-400/8 border border-lime-400/15 group-hover:bg-lime-400/12 group-hover:border-lime-400/25 transition-all duration-300">
              <Zap size={16} className="text-lime-400" />
            </div>
            {!collapsed && (
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-extrabold text-white tracking-tight">ZAPE</span>
                <span className="text-sm font-thin text-zinc-600 tracking-tight">control</span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          {!collapsed && (
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 hover:text-white transition-colors lg:hidden"
              aria-label="Fechar menu"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center py-2 text-zinc-700 hover:text-zinc-400 transition-colors cursor-pointer"
          title={collapsed ? "Expandir menu" : "Minimizar menu"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        {/* Navigation */}
        <nav className={`flex-1 ${collapsed ? "px-2" : "px-4"} py-4 space-y-2 overflow-y-auto`}>
          {filteredGroups.map((group) => {
            const isOpen = openGroups[group.id] ?? false;
            const hasActiveChild = group.children.some((c) => isActive(c.href));

            // Collapsed mode: show only icons
            if (collapsed) {
              return (
                <div key={group.id} className="space-y-1">
                  {group.children.map((item) => {
                    const active = !item.external && isActive(item.href);
                    const iconEl = <item.icon size={18} strokeWidth={active ? 2 : 1.5} />;
                    const cls = `flex items-center justify-center w-full rounded-xl p-2.5 transition-all duration-200 ${
                      active
                        ? "bg-lime-400/8 text-lime-400 border border-lime-400/15"
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent"
                    }`;
                    if (item.external) {
                      return <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={cls} title={item.label}>{iconEl}</a>;
                    }
                    return <Link key={item.href} href={item.href} className={cls} title={item.label}>{iconEl}</Link>;
                  })}
                </div>
              );
            }

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
        <div className={`border-t border-[#222222] ${collapsed ? "px-2 py-3" : "px-4 py-4"} space-y-1`}>
          <button
            onClick={() => { setShowPasswordModal(true); setPwFeedback(null); setNewPassword(""); setConfirmPassword(""); }}
            className={`w-full flex items-center rounded-xl text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.03] border border-transparent transition-all cursor-pointer ${collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2 text-[12px] font-semibold"}`}
            title="Alterar Senha"
          >
            <KeyRound size={14} /> {!collapsed && "Alterar Senha"}
          </button>
          <button
            onClick={async () => {
              const { getSupabase } = await import("@/lib/supabase");
              await getSupabase().auth.signOut();
              window.location.href = "/login";
            }}
            className={`w-full flex items-center rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-400/5 border border-transparent transition-all cursor-pointer ${collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2 text-[12px] font-semibold"}`}
            title="Sair"
          >
            <LogOut size={14} /> {!collapsed && "Sair"}
          </button>
          {!collapsed && (
            <p className="text-[10px] font-semibold text-zinc-700 tracking-widest uppercase px-3 pt-1">
              ZapeControl v2.0
            </p>
          )}
        </div>
      </aside>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowPasswordModal(false)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[#222222] bg-[#0a0a0a] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#222222]">
              <h2 className="text-base font-extrabold text-white">Alterar Senha</h2>
              <button onClick={() => setShowPasswordModal(false)} className="rounded-lg p-2 text-zinc-600 hover:text-white hover:bg-white/5 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {pwFeedback && (
                <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-[12px] font-semibold border ${pwFeedback.type === "success" ? "bg-lime-400/8 border-lime-400/15 text-lime-400" : "bg-red-400/8 border-red-400/15 text-red-400"}`}>
                  {pwFeedback.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
                  {pwFeedback.msg}
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Nova Senha</label>
                <input
                  type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  className="w-full rounded-xl border border-[#222222] bg-[#111111] px-4 py-3 text-[13px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-600 block mb-1.5">Confirmar Senha</label>
                <input
                  type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  onKeyDown={(e) => e.key === "Enter" && newPassword && confirmPassword && !pwSaving && document.getElementById("btn-save-pw")?.click()}
                  className="w-full rounded-xl border border-[#222222] bg-[#111111] px-4 py-3 text-[13px] font-semibold text-white placeholder-zinc-700 outline-none focus:border-lime-400/30 transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#222222]">
              <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded-xl text-[12px] font-bold text-zinc-500 hover:text-white cursor-pointer">Cancelar</button>
              <button
                id="btn-save-pw"
                disabled={pwSaving || !newPassword || !confirmPassword}
                onClick={async () => {
                  if (newPassword.length < 6) { setPwFeedback({ type: "error", msg: "Senha deve ter no minimo 6 caracteres" }); return; }
                  if (newPassword !== confirmPassword) { setPwFeedback({ type: "error", msg: "Senhas nao conferem" }); return; }
                  setPwSaving(true);
                  const { getSupabase } = await import("@/lib/supabase");
                  const { error } = await getSupabase().auth.updateUser({ password: newPassword });
                  if (error) { setPwFeedback({ type: "error", msg: error.message }); }
                  else { setPwFeedback({ type: "success", msg: "Senha alterada com sucesso!" }); setTimeout(() => setShowPasswordModal(false), 1500); }
                  setPwSaving(false);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-lime-400/10 border border-lime-400/20 text-[12px] font-bold text-lime-400 hover:bg-lime-400/15 cursor-pointer disabled:opacity-40"
              >
                {pwSaving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
