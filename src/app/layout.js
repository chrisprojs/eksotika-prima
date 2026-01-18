import Footer from "@/components/footer/page";
import "./globals.css";
import Navbar from "@/components/navbar/page";
import '@fortawesome/fontawesome-free/css/all.min.css';

export const metadata = {
  authors: [{ name: "Eksotika Prima" }],
  creator: "Eksotika Prima",
  publisher: "Eksotika Prima",
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({ children }) {  
  return (
    <html lang="id">
      <body>
        <div className="app-container">
          <Navbar/>
          <div className='page-layout'>
            {children}
          </div>
          <Footer /> 
        </div>
    </body>
    </html>
  );
}
