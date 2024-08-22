"use client";
import Card from "@/components/card/page";
import React, { useEffect, useState } from "react";
import { getAllProduct } from "@/fetch/getAllProduct";
import "./page.css";
import Loading from "@/components/loading/page";

export default function Product() {
  const [searchTerm, setSearchTerm] = useState("");
  const [productList, setProductList] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const products = await getAllProduct();
      setProductList(products);
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  
  const loadCard = () => {
    if(!productList){
      return <Loading />;
    }
    else{
      const filteredProducts = productList.filter((product) =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return(
        <>
          <div className="card-grid">
            {filteredProducts.map((product) => (
              <Card key={product.title} product={product} />
            ))}
          </div>
        </>
      )
    }
  }

  return (
    <div className="page-container">
      <div className="product-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearch}
          className="product-input"
        />
      </div>
      <p className="page-heading">Produk Kami</p>
      {loadCard()}
    </div>
  );
}
