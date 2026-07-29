import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
export const metadata: Metadata = { title: "Usta Pro", description: "Offline construction management", manifest: "/manifest.json", appleWebApp: { capable: true, title: "Usta Pro", statusBarStyle: "black" } };
export const viewport: Viewport = { themeColor: "#000000" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="uz" className="dark"><body><AppShell>{children}</AppShell></body></html>; }
