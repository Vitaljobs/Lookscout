import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ProjectProvider } from '@/context/ProjectContext';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Master Dashboard - Control Tower",
  description: "Centralized dashboard for managing all your projects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-[#0f1419] text-white`}>
        <ProjectProvider>
          {children}
        </ProjectProvider>
      </body>
    </html>
  );
}
