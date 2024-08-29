import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req) {
  const data = await req.json();
  const url = new URL(req.url);
  const post_many = (url.searchParams.get('post_many')) === 'true'

  if(post_many){
    try{
      await prisma.$transaction(
        data.map((product) => 
          prisma.product.create({
            data: {
              title: product.title,
              merk: product.merk,
              produsen: product.produsen,
              detail: product.detail,
              variants: {
                create: product.variants.map(variant => ({
                  picture: variant.picture,
                  size: variant.size,
                  fromPrice: variant.fromPrice,
                  price: variant.price,
                  dozenPrice: variant.dozenPrice || null,
                })),
              },
            }
          })
        )
      )
      return new NextResponse(JSON.stringify("Many Products Successfully Posted"), { status: 201 });
    } catch (error) {
      console.error('Error creating many products:', error);
      return new NextResponse(JSON.stringify({ error: 'Error creating many products' }), { status: 500 });
    }
  }
  else{
    try {
      const product = await prisma.product.create({
        data: {
          title: data.title,
          merk: data.merk,
          produsen: data.produsen,
          detail: data.detail,
          variants: {
            create: data.variants.map(variant => ({
              picture: variant.picture,
              size: variant.size,
              fromPrice: variant.fromPrice,
              price: variant.price,
              dozenPrice: variant.dozenPrice || null,
            })),
          },
        },
      });
      return new NextResponse(JSON.stringify(product), { status: 201 });
    } catch (error) {
      console.error('Error creating product:', error);
      return new NextResponse(JSON.stringify({ error: 'Error creating product' }), { status: 500 });
    }
  }
}

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

// export async function PUT(req) {
//   const data = await req.json();
//   const url = new URL(req.url);
//   const product_id = url.searchParams.get("product_id")
  
//   if(product_id){
//     try{
//       const updatedProduct = await prisma.product.update({
//         where: {productId: parseInt(product_id,10)},
//         data: {
//           title: data.title || undefined,
//           merk: data.merk || undefined,
//           produsen: data.produsen || undefined,
//           detail: data.detail || undefined,
//           variants: data.variants
//             ? {
//                 deleteMany: {},  // Delete existing variants
//                 create: data.variants, // Create new variants
//               }
//           : undefined, 
//         },
//         include: {variants: true}
//       })
//       return new NextResponse(JSON.stringify(updatedProduct), { status: 200 });
//     } catch (error) {
//       console.error('Error updating product by id:', error);
//       return new NextResponse(JSON.stringify({ error: 'Error updating product by id' }), { status: 500 });
//     }
//   } else {
//     return new NextResponse(JSON.stringify({ error: 'Product ID is required for updating' }), { status: 400 });
//   }
// }

// export async function DELETE(req){
//   const url = new URL(req.url);
//   const product_id = url.searchParams.get("product_id")

//   if(product_id){
//     try{
//       await prisma.product.delete({
//         where: {productId: parseInt(product_id, 10)}
//       })
//       return new NextResponse(JSON.stringify("Deleted Successfully"), { status: 200 });
//     } catch (error) {
//       console.error('Error deleting product by id:', error);
//       return new NextResponse(JSON.stringify({ error: 'Error deleting product by id' }), { status: 500 });
//     }
//   } else {
//     return new NextResponse(JSON.stringify({ error: 'Product ID is required for deletion' }), { status: 400 });
//   }
// }