import Footer from "@/components/footer/page";
import "./globals.css";
import Navbar from "@/components/navbar/page";
import "@fortawesome/fontawesome-free/css/all.min.css";

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
    <html lang="id">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7470776396597629"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <div className="app-container">
          <Navbar />
          <div className="page-layout">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
