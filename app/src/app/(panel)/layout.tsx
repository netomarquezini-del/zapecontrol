'use client'

import Sidebar from "@/components/sidebar";
import AuthGuard from "@/components/auth-guard";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto lg:ml-0">
          <div className="px-6 py-8 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
