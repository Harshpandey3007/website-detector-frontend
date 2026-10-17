"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, LayoutDashboard } from "lucide-react";

// 1. Tell TypeScript to expect the prop
interface SidebarProps {
  onNavigate?: () => void;
}

// 2. Accept the prop
export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Monitors", href: "/monitors", icon: Activity },
    { name: "Alerts", href: "/alerts", icon: Bell },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-zinc-800 gap-3">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white">A</div>
        <span className="font-bold text-lg tracking-tight text-white">Aegis Watch</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onNavigate} // 3. Call the prop when a link is clicked
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive ? "bg-indigo-500/10 text-indigo-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <Icon size={18} /> {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}