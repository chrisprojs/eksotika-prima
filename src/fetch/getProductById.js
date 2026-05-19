import { api_url } from "./API";

export async function getProductById(productId) {
  let attempt = 1;
  while(attempt < 5){
    try{
      const response = await fetch(`${api_url}/products?product_id=${productId}`)
      if (!response.ok) {
        return null;
      }
      const data = await response.json()
      return data
    }catch (error){
      console.error('Failed to get product by id', error);
      await new Promise(res => setTimeout(res, 1000));
      attempt++;
    }
  }
  console.error('Please Try Again Later');
  return [];
}
