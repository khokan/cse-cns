"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import Image from "next/image";
import LogoutButton from "./logout-button";

type NavbarUser = {
  name?: string;
  role?: "STUDENT" | "ADMIN";
};

interface NavbarClientProps {
  user: NavbarUser | null;
  menu: Array<{ href: string; label: string }>;
}

export default function NavbarContent({ user, menu }: NavbarClientProps) {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b bg-background/95 shadow-sm backdrop-blur-md"
          : "border-b/0 bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="shrink-0 group">
          <div className="relative h-10 w-36 transition-transform group-hover:scale-105 md:h-12 md:w-40">
            <Image
              src="/logo.svg"
              alt="CSE Logo"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 10rem, 10rem"
            />
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {menu.map((m) => (
            <Button
              key={m.href}
              asChild
              variant="ghost"
              className="rounded-full px-4 text-[0.95rem] font-medium tracking-tight hover:bg-primary/5 hover:text-primary"
            >
              <Link href={m.href}>{m.label}</Link>
            </Button>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary"
          >
            <Sun className="hidden h-4 w-4 dark:block" />
            <Moon className="h-4 w-4 dark:hidden" />
          </Button>

          {/* User Actions */}
          {!user ? (
            <>
              <Button
                asChild
                variant="ghost"
                className="rounded-full px-4 text-[0.95rem] font-medium tracking-tight hover:bg-primary/5 hover:text-primary"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button
                asChild
                className="rounded-full bg-success px-5 text-[0.95rem] font-semibold tracking-tight text-success-foreground hover:bg-success/90"
              >
                <Link href="/register">Register</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="hidden pr-2 text-sm text-muted-foreground md:block">
                <span className="font-medium text-foreground">{user.name}</span> · <span className="text-success">{user.role}</span>
              </div>
               <LogoutButton />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
