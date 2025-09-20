"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Image, LayoutGrid, Home } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const navItems = [
  { href: "/", label: "Pics", icon: Image },
  { href: "/gallery", label: "Gallery", icon: LayoutGrid },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="absolute top-0 left-0 w-full p-4 z-50 bg-gradient-to-b from-background/80 to-transparent">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
            <Home className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary tracking-widest hidden sm:block">ALLPI</h1>
        </Link>
        <nav className="flex items-center gap-1 p-1 rounded-full border border-accent/50 bg-background/50 backdrop-blur-sm">
          <TooltipProvider>
            {navItems.map(({ href, label, icon: Icon }) => (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link href={href}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full h-8 w-8 transition-colors",
                        pathname === href
                          ? "bg-accent text-background"
                          : "hover:bg-accent/20"
                      )}
                      aria-label={label}
                    >
                      <Icon className="w-5 h-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </div>
    </header>
  );
}
