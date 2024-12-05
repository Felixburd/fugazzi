import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import dynamic from 'next/dynamic';

const CrystalBackground = dynamic(() => import('@/components/CrystalBackground'), {
  ssr: false // Disable server-side rendering for Three.js component
});

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
        <CrystalBackground />
        <Header />
        <main style={{ 
          paddingTop: '72px',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
        }}>
          {children}
        </main>
        <footer style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: '0.75rem',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-geist-mono)',
          zIndex: 1,
          textAlign: 'center',
          backdropFilter: 'blur(5px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          Félix Burt © 2024
        </footer>
      </body>
    </html>
  );
}
