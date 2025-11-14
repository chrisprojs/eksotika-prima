// app/product/page.jsx (server component)

import "./page.css";
import ProductClient from "./ProductClient";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL),

  title: "Cari Minyak Gosok Termurah Se-Indonesia | Eksotika Prima",
  description:
    "Cari minyak gosok termurah di Indonesia. Menyediakan minyak gosok berkualitas dengan harga termurah dan bisa nego untuk pembelian besar.",
  keywords: [
    "supplier minyak gosok",
    "minyak gosok murah",
    "pabrik minyak gosok",
    "grosir minyak gosok",
    "minyak gosok terbesar",
    "Eksotika Prima",
    "minyak urut",
    "minyak pijat",
  ],

  openGraph: {
    title: "Cari Minyak Gosok Termurah Se-Indonesia | Eksotika Prima",
    description:
      "Cari minyak gosok termurah di Indonesia. Menyediakan minyak gosok berkualitas dengan harga termurah dan bisa nego untuk pembelian besar.",
    url: `${process.env.NEXT_PUBLIC_URL}/product`,
    type: "website",
    images: [
      {
        url: "http://localhost:3000/api/images/product/Minyak%20Cap%20Tawon%20Super/330%20ml.jpg",
        alt: "Cari Minyak Gosok Termurah Se-Indonesia | Eksotika Prima",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Cari Minyak Gosok Termurah Se-Indonesia | Eksotika Prima",
    description:
      "Supplier minyak gosok termurah. Kualitas terbaik & bisa nego pembelian besar.",
    images: ["http://localhost:3000/api/images/product/Minyak%20Cap%20Tawon%20Super/330%20ml.jpg"],
  },
};

export default function ProductPage() {
  return <ProductClient />;
}