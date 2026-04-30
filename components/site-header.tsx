import { ChevronDown, LogIn, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import Image from "next/image";

const navItems: { label: string; hasDropdown?: boolean; href?: string }[] = [
  { label: "BugBash 2026" },
  { label: "Product", hasDropdown: true },
  { label: "Solutions", hasDropdown: true },
  { label: "Company", hasDropdown: true },
  { label: "Docs" },

];

function Logo() {
  return (
    <Link
      href="/"
      className="text-base font-medium tracking-tight text-foreground transition-colors hover:text-foreground/90"
    >
      <Image src="/logo.svg" alt="Antithesis" width={100} height={100} className="h-auto w-auto" />
    </Link>
  );
}

export default function SiteHeader() {
  return (
    <header className="sticky top-4 z-30 mt-4 flex justify-center px-4">
      <nav className="flex h-12 max-w-[calc(100vw-2rem)] items-center gap-5 rounded-full border border-white/10 bg-[rgba(10,8,32,0.65)] px-5 backdrop-blur-md shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]">
        <Logo />

        <ul className="flex items-center gap-5 text-sm text-muted-foreground">
          {navItems.map((item) => {
            const inner = (
              <>
                {item.label}
                {item.hasDropdown && (
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                )}
              </>
            );
            return (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 transition-colors hover:text-foreground"
                  >
                    {inner}
                  </Link>
                ) : (
                  <a
                    href="#"
                    className="flex items-center gap-1 transition-colors hover:text-foreground"
                  >
                    {inner}
                  </a>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Search"
            nativeButton={false}
            render={<a href="#" />}
          >
            <Search />
          </Button>
          <Button variant="ghost" size="sm" nativeButton={false} render={<a href="#" />}>
            <LogIn />
            Log in
          </Button>
        </div>
      </nav>
    </header>
  );
}
