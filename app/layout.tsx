import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from '../components/AuthProvider';

export const metadata: Metadata = {
  title: "NAOL Build · Flyff Universe Build Optimizer",
  description: "Build it. Simulate it. Optimize it. A character laboratory powered by official Flyff Universe data.",
  icons: {
    icon: { url: "/naol-favicon.png", type: "image/png" },
    shortcut: "/naol-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
