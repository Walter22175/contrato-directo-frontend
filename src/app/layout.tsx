import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import GlobalChatbot from "@/components/providers/GlobalChatbot";

export const metadata: Metadata = {
  title: "Contrato Directo - Conecta. Acuerda. Realiza.",
  description: "Plataforma que conecta clientes con proveedores de servicios de confianza en Argentina.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-950 text-slate-200 antialiased">
        <AuthProvider>{children}</AuthProvider>
        <GlobalChatbot />
      </body>
    </html>
  );
}
