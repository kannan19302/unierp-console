import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@kannan19302/ui/styles";
import "@kannan19302/ui/styles.css";
import { ThemeProvider } from "@kannan19302/ui/theme";
import { ToastProvider } from "@kannan19302/ui/notifications";
import { RootAuthProvider } from "@/components/AuthShell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "UniERP Platform Admin Console",
  description: "Internal control-plane management — restricted access",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} data-theme="strata-dark" data-platform="platform-admin" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0, fontFamily: "var(--font-sans, system-ui, sans-serif)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
        <ThemeProvider defaultSetting="strata-dark" defaultPlatform="platform-admin">
          <RootAuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </RootAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
