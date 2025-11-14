import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req){
  const url = new URL(req.url);
  const product_id = url.searchParams.get('product_id');

  if(product_id){
    try{
      const product = await prisma.product.findUnique({
        where: {productId: parseInt(product_id,10)},
        include: {variants: true}
      });
      if (product) {
        return new NextResponse(JSON.stringify(product), { status: 200 });
      } else {
        return new NextResponse(JSON.stringify({ error: 'Product not found' }), { status: 404 });
      }
    } catch (error) {
      console.error('Error getting product by id:', error);
      return new NextResponse(JSON.stringify({ error: 'Error getting product by id' }), { status: 500 });
    }
  }
  else{
    try{
      const product = await prisma.product.findMany({
        include: {variants: true}
      })
      return new NextResponse(JSON.stringify(product), { status: 200 });
    } catch (error) {
      console.error('Error getting products:', error);
      return new NextResponse(JSON.stringify({ error: 'Error getting products' }), { status: 500 });
    }
  }
}