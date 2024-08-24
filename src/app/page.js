import "./page.css";
import Image from 'next/image';
import CardLoad from "@/components/cardLoad/page";

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
      <div className='home-area-box'>
        <p className="home-area-text">
          Makassar - Ambon
        </p>
      </div>
      <div className='page-container'>
        <p className='page-heading'>Produk Kami</p>
        <CardLoad/>
      </div>
    </>
  );
}
