import "./globals.css";

import {
  AuthProvider
} from "@/contexts/AuthContext";

export const metadata = {
  title:
    "Gestão Interna Alto Vale",
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
          {children}
        </AuthProvider>

      </body>

    </html>
  );
}