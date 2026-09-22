import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/auth-guard";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Barbershop POS - Desktop",
  description: "Aplikasi manajemen Barbershop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
