import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "English Notes",
  description: "A simple English learning app.",
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
