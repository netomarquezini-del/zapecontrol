'use client'

import AuthGuard from "@/components/auth-guard";

export default function ExternalLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard><div className="min-h-full">{children}</div></AuthGuard>;
}
