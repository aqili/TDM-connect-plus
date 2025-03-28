import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SessionProvider from '@/components/providers/SessionProvider';
import "./globals.css";
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TDM Connect Plus",
  description: "TDM Connect Plus - Employee Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
} 