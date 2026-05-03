import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Private Trading Dashboard",
  description: "A calm market command center for personal trading context."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
