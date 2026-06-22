import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CNR AI Hub",
  description: "Discord AI command center for CNR gameplay, player memory, moderation, and intelligent automation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
