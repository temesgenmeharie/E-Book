import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-Book Marketplace | Discover, Buy & Read Digital Books",
  description: "A premier multi-vendor digital e-book marketplace for authors, publishers, and readers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}

