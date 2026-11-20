import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ErrorBoundary } from "@sentry/nextjs";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import GlobalChatbot from "@/components/providers/GlobalChatbot";
import BlacklightOverlay from "@/components/providers/BlacklightOverlay";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Contrato Directo - Conecta. Acuerda. Realiza.",
  description: "Plataforma que conecta clientes con proveedores de servicios de confianza en Argentina.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Contrato Directo",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#03081a",
};

const sentryEnabled =
  process.env.NEXT_PUBLIC_SENTRY_ENABLED !== "false" &&
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const app = (
    <AuthProvider>
      <GlobalChatbot />
      <BlacklightOverlay />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </AuthProvider>
  );

  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen text-slate-300 antialiased" style={{ backgroundColor: '#03081a' }}>
        {sentryEnabled ? <ErrorBoundary>{app}</ErrorBoundary> : app}
      </body>
    </html>
  );
}
