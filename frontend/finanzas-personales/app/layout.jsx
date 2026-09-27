import { Geist, Geist_Mono } from "next/font/google";
import { AlertProvider } from "@/components/AlertProvider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "Finance Tracker",
  description: "Gestioná tus finanzas personales y grupales",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AlertProvider>{children}</AlertProvider>
      </body>
    </html>
  );
}