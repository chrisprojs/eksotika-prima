import "./page.css";
import Image from 'next/image';
import CardLoad from "@/components/cardLoad/page";

const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000" 
export const metadata = {
  title: "Supplier Minyak Gosok Terbesar Se-Indonesia | Eksotika Prima",
  description:
    "Supplier minyak gosok terbesar di Indonesia. Menyediakan minyak gosok berkualitas dengan harga termurah dan bisa nego untuk pembelian besar.",
  keywords: [
    "supplier minyak gosok",
    "minyak gosok murah",
    "pabrik minyak gosok",
    "grosir minyak gosok",
    "minyak gosok terbesar",
    "Eksotika Prima",
    "minyak urut",
    "minyak pijat"
  ],

  openGraph: {
    title: "Supplier Minyak Gosok Terbesar Se-Indonesia | Eksotika Prima",
    description:
      "Supplier minyak gosok terbesar di Indonesia. Harga termurah, kualitas terjamin, bisa nego untuk pembelian besar.",
    url: `${baseUrl}`,
    siteName: "Eksotika Prima",
    type: "website",
    images: [
      {
        url: `${baseUrl}/api/images/product/Minyak%20Cap%20Tawon%20Super/330%20ml.jpg`,
        alt: "Supplier Minyak Gosok Terbesar - Eksotika Prima",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Supplier Minyak Gosok Terbesar Se-Indonesia | Eksotika Prima",
    description:
      "Supplier minyak gosok terbesar di Indonesia. Harga termurah, kualitas terjamin, bisa nego untuk pembelian besar.",
    images: [`${baseUrl}/api/images/product/Minyak%20Cap%20Tawon%20Super/330%20ml.jpg`],
  },
};

export default function Home() {
  return (
    <>
      <div className='home-img-container'>
      <Image src="/asset/home_template_1.jpg" alt="home img template" className='home-img-template' width={1024} height={256}></Image>
        <p className='home-img-text'>Supplier Minyak Gosok Terbesar Se-Indonesia<br/>
          <span className='home-img-text2'>Harga Termurah, Bisa Nego</span>
        </p>
        <div className='home-blast-sign'>
          <p>Beli Banyak Nego Banyak!</p>
        </div>
      </div>
      <div className='home-location-box'>
        <p className="home-location-text">
          Metro Indah III Blok.C No.31A RT.1/RW.4, Papanggo, Tanjung Priok, Jakarta Utara, DKI Jakarta, 14340
        </p>
      </div>
      <div className='page-container'>
        <p className='page-heading'>Produk Kami</p>
        <CardLoad/>
      </div>
    </>
  );
}
