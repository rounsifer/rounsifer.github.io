import "~/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const description =
  "Senior Software Engineer building high-performance, mission-critical embedded and platform systems.";

export const metadata: Metadata = {
  metadataBase: new URL("https://rounsifer.github.io"),
  title: "Ron Rounsifer",
  description,
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "Ron Rounsifer",
    description,
    url: "https://rounsifer.github.io",
    siteName: "Ron Rounsifer",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ron Rounsifer",
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${inter.variable} no-scrollbar overflow-x-hidden overflow-y-scroll bg-zinc-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] lg:overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
