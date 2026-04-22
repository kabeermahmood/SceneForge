"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImageIcon, Mic, KeyRound, Paintbrush, AudioLines } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Image Generation", icon: ImageIcon },
  { href: "/thumbnails", label: "Thumbnails", icon: Paintbrush },
  { href: "/voice-studio", label: "Voice Studio", icon: AudioLines },
  { href: "/pronunciation", label: "Pronunciation Checker", icon: Mic },
  { href: "/api-keys", label: "API Keys", icon: KeyRound },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/60 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 mb-2">
      <Link href="/" className="font-heading text-lg font-bold text-accent">
        SceneForge
      </Link>
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                active
                  ? "bg-accent/15 text-accent"
                  : "text-text-secondary hover:bg-border/50 hover:text-text-primary"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
