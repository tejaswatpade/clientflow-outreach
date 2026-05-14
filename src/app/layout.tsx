import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website Revenue Audit",
  description: "Find website revenue leaks, booking gaps, and conversion system fixes."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
