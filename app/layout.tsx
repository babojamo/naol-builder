import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NAOL Build · Flyff Universe Build Optimizer",
  description: "Build it. Simulate it. Optimize it. A character laboratory powered by official Flyff Universe data.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
