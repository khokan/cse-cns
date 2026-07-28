import "./globals.css";
import type { Metadata } from "next";

// app/layout.tsx
export const dynamic = "force-dynamic";

import { Footer } from "@/components/shared/footer";
import { Toaster } from "sonner";
import Navbar from "@/components/shared/navbar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import QueryProviders from "@/components/providers/Queryprovider";

export const metadata: Metadata = {
  title: "CSE WEB",
  description: "CSE WEB",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryProviders>
            <main className="min-h-[calc(100vh-170px)]">{children}</main>
            <Toaster richColors position="top-right" />
          </QueryProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
