import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Sinhala } from "next/font/google";
import "./globals.css";
import { AudioQueueProvider } from "@/contexts/audio-queue-context";
import { ThemeProvider } from "@/contexts/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSinhala = Noto_Sans_Sinhala({
  variable: "--font-sinhala",
  subsets: ["sinhala"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Sinhala Text-to-Speech",
  description: "Convert Sinhala Unicode text to natural speech using SinhalaVITS-TTS-F1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="si" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSinhala.variable} antialiased`}
      >
        <ThemeProvider>
          <AudioQueueProvider>
            {children}
          </AudioQueueProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
