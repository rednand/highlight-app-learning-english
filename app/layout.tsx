import type { Metadata } from "next";
import "./globals.css";
import SwRegister from "./sw-register";
import NextTopLoader from "nextjs-toploader";

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
      <body className="app-body" suppressHydrationWarning>
        <NextTopLoader color="#facc15" shadow="0 0 10px #facc15,0 0 5px #facc15" showSpinner={false} />
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
