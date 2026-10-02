import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OBEMIC | Outcome-Based Education Management",
  description: "Next-generation Academic Performance & Outcome-Based Education Management System.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${outfit.variable}`}>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' } }} />
        {children}
      </body>
    </html>
  );
}
