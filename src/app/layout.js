import Footer from "@/components/footer/page";
import "./globals.css";
import Navbar from "@/components/navbar/page";
import '@fortawesome/fontawesome-free/css/all.min.css';

export const metadata ={
  title: 'Eksotika Prima'
}

export default function RootLayout({ children }) {  
  return (
    <html lang="en">
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
