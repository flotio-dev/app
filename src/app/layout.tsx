import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeModeProvider } from "@/components/preferences/ThemeModeProvider";
import { AuthProvider } from "@/auth/AuthContext";
import { BuildRefreshProvider } from "@/context/BuildRefreshContext";
import { CliModalProvider } from "@/context/CliModalContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Flotio — Cloud CI/CD Console",
  description: "Automated cloud build and deployment console for Flutter mobile applications.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeModeProvider>
          <AuthProvider>
            <BuildRefreshProvider>
              <CliModalProvider>
                {children}
              </CliModalProvider>
            </BuildRefreshProvider>
          </AuthProvider>
        </ThemeModeProvider>
      </body>
    </html>
  );
}
