import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Polyform",
  description: "One workspace. Every language. Zero barriers.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

