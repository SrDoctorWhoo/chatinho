import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Chatinho • Inteligência e Gestão em Atendimento",
  description: "A plataforma definitiva para automação de WhatsApp e gestão de atendimento com IA.",
  keywords: ["whatsapp", "atendimento", "ia", "crm", "automação"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${plusJakarta.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans selection:bg-emerald-500/10 selection:text-emerald-500">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
