import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aljinan - Client-Facing Operations Platform",
  description: "A shared workspace between service providers and clients",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
