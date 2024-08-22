import { api_url } from "./API";


export async function getAllProduct() {
  let attempt = 1;
  while(attempt < 5){
    try{
      const response = await fetch(`${api_url}/products`)
      const data = await response.json()
      return data
    }catch (error){
      console.error('Failed to get all product', error);
      await new Promise(res => setTimeout(res, 1000));
      attempt++;
    }
  }
  console.error('Please Try Again Later');
  return [];
}