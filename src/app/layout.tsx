import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Fugazzi",
  description: "Fugazzi Gem Trading Game",
  icons: {
    icon: '/diamond_icon.ico',
    shortcut: '/diamond_icon.ico',
    apple: '/diamond_icon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main style={{ 
          paddingTop: '72px', // Header height + some spacing
          minHeight: '100vh',
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}
