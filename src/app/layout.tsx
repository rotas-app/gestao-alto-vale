import "./globals.css";

import type { Metadata } from "next";

import { AuthProvider } from "@/contexts/AuthContext";
import { BaseProvider } from "@/contexts/BaseContext";

export const metadata: Metadata = {
  title: "Gestão Interna Alto Vale",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <BaseProvider>{children}</BaseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
