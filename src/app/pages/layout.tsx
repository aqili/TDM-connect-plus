"use client";

import { SidebarDemo } from "@/components/ui/sidebar-demo";
import { cn } from "@/lib/utils";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-neutral-900">
      <div className="flex-shrink-0">
        <SidebarDemo />
      </div>
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="h-full px-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">TDM Connect Plus</h1>
            <div className="flex items-center gap-4">
              {/* Add header actions here (notifications, etc.) */}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 