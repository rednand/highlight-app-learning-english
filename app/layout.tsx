import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Highlight",
  description: "Registre suas aulas e aprenda inglês com flashcards.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Highlight",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="app-html">
      <body className="app-body">{children}</body>
    </html>
  );
}
