import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import GlobalChatbot from "@/components/providers/GlobalChatbot";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Contrato Directo - Conecta. Acuerda. Realiza.",
  description: "Plataforma que conecta clientes con proveedores de servicios de confianza en Argentina.",
  icons: {
    icon: "/logo-institucional.png",
    shortcut: "/logo-institucional.png",
    apple: "/logo-institucional.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-200 antialiased">
        <AuthProvider>
          <GlobalChatbot />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
