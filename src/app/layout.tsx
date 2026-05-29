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
        className={`font-sans ${inter.variable} no-scrollbar overflow-x-hidden overflow-y-scroll lg:overflow-hidden`}
      >
        <a
          href="#experience"
          className="sr-only z-50 rounded bg-zinc-800 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          Skip to experience
        </a>
        {children}
      </body>
    </html>
  );
}
