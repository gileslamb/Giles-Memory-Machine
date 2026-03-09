import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

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
        className={`${dmSans.variable} font-sans antialiased min-h-screen`}
        style={{ backgroundColor: "#0a0a0a", color: "#e8e8e8" }}
      >
        {children}
      </body>
    </html>
  );
}
