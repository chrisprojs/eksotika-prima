import "./page.css";
import Image from 'next/image';
import Card from "@/components/card/page";
import { getAllProduct } from "@/fetch/getAllProduct";

export default async function Home() {
  const productList = await getAllProduct();

  return (
    <>
      <div className='home-img-container'>
      <Image src="/asset/home_template_1.jpg" alt="home img template" className='home-img-template' width={1024} height={256}></Image>
        <p className='home-img-text'>Supplier Produk Makassar<br/>
          <span className='home-img-text2'>Harga Termurah, Bisa Nego</span>
        </p>
        <div className='home-blast-sign'>
          <p>Beli Banyak Nego Banyak!</p>
        </div>
      </div>
      <div className='page-container'>
        <p className='page-heading'>Produk Kami</p>
        <div className="card-grid">
            {productList.map((product) => (
              <Card key={product.title} product={product} />
            ))}
        </div>
      </div>
    </>
  );
}
