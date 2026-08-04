import type { Metadata } from "next";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
