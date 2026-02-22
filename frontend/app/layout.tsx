import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SLR Control",
  description: "Satellite Laser Ranging Control Interface",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body className="bg-bg text-text font-sans h-screen flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden min-h-0">
          {children}
        </main>
      </body>
    </html>
  );
}