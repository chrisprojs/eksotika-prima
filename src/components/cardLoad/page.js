"use client";
import React, { useEffect, useState } from 'react'
import Card from '../card/page';
import Loading from '../loading/page';
import { getAllProduct } from '@/fetch/getAllProduct';
import "./page.css"

function CardLoad({searchTerm = ""}) {
  const [productList, setProductList] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const products = await getAllProduct();
      setProductList(products);
    };

    fetchData();
  }, []);

  if(!productList){
    return <Loading />;
  }
  else{
    const filteredProducts = productList.filter((product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return(
      <>
        <div className="cardLoad-grid">
          {filteredProducts.map((product) => (
            <Card key={product.title} product={product} />
          ))}
        </div>
      </>
    )
  }
};

export default CardLoad