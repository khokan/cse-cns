import "./globals.css";
import type { Metadata } from "next";
import { NuqsAdapter } from 'nuqs/adapters/next/pages'

// app/layout.tsx
export const dynamic = "force-dynamic";

import { Footer } from "@/components/shared/footer";
import { Toaster } from "sonner";
import Navbar from "@/components/shared/navbar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import QueryProviders from "@/components/providers/Queryprovider";
import { PerformanceMonitor } from "@/components/providers/performance-monitor";

export const metadata: Metadata = {
  title: "CSE Insights",
  description: "CSE Insights - Chittagong Stock Exchange",
  icons: {
    icon: "/cse-ico.png",
    apple: "/cse-ico.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryProviders>
            <PerformanceMonitor />
            <NuqsAdapter>
              <main className="min-h-[calc(100vh-170px)]">{children}</main>
              <Toaster richColors position="top-right" />
            </NuqsAdapter>
          </QueryProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
