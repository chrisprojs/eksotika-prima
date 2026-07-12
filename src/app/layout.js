import Script from "next/script";
import Footer from "@/components/footer/page";
import "./globals.css";
import Navbar from "@/components/navbar/page";

export const metadata = {
  authors: [{ name: "Eksotika Prima" }],
  creator: "Eksotika Prima",
  publisher: "Eksotika Prima",
  icons: {
    icon: "/favicon.ico",
    apple: "/asset/logo.jpg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <div className="app-container">
          <Navbar />
          <div className="page-layout">{children}</div>
          <Footer />
        </div>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7470776396597629"
          strategy="lazyOnload"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
