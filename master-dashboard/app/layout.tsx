import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ProjectProvider } from '@/context/ProjectContext';
import { AlertProvider } from '@/context/AlertContext';
import AIAssistant from '@/components/AIAssistant';
import { CommandPalette } from '@/components/CommandPalette';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Titan Control Tower",
  description: "Neural Interface for Project Management",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-[var(--background)] text-white`}>
        <ProjectProvider>
          <AlertProvider>
            {children}
            <AIAssistant />
            <CommandPalette />
          </AlertProvider>
        </ProjectProvider>
      </body>
    </html>
  );
}
