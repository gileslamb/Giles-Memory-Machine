import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Giles Memory Machine",
  description: "Maintain AI_CONTEXT.md — instant context for any AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="font-sans antialiased min-h-screen bg-surface text-ink"
        style={{ backgroundColor: "#0d0d0d", color: "#e5e5e5" }}
      >
        {children}
      </body>
    </html>
  );
}
