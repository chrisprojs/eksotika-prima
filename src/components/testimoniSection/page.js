import React from 'react'
import Image from 'next/image'
import "./page.css"

function TestimoniSection() {
  const testimonials = [
    {
      id: 1,
      name: "Ahmad S.",
      image: "/asset/testimoni_face/1.jpg",
      comment: "Langganan beli minyak tawon… ini mungkin udah ke berapa puluh kalinya saya beli.. all good packing ok.. thx thx"
    },
    {
      id: 2,
      name: "Susi W.",
      image: "/asset/testimoni_face/2.jpg",
      comment: "Barang telah diterima dengam baik sesuai pesanan, minyak tawon tutup putih selalu menjadi langganan"
    },
    {
      id: 3,
      name: "Yoko R.",
      image: "/asset/testimoni_face/3.jpg",
      comment: "saya suka minyak gosok cap Beruang..sdh beulang kali pesan...kalo sdh gosok telapak kaki bisa tidur nyenyak..tks.sdh.nyampe dg baik .tapi"
    },
    {
      id: 4,
      name: "Dewi K.",
      image: "/asset/testimoni_face/4.jpg",
      comment: "Selalu puas beli disini..barang gak pernah salah ataupun dlm kondisi rusak.. bungkus nya juga 👍🏻👍🏻 banget...amanah pokoknya."
    },
    {
      id: 5,
      name: "Lina T.",
      image: "/asset/testimoni_face/5.jpg",
      comment: "Fast respon, packing sangat rapi & safety, cepat diproses & kirim, kurir nya cepat, barangnya sesuai deskripsi, overall good.. recommended seller.."
    },
    {
      id: 6,
      name: "Rudi P.",
      image: "/asset/testimoni_face/6.jpg",
      comment: "Seller top. Pagi chat, langsung order.. abis maksi, barang udah diterima. Aman. Packingnya melindungi produk dengan baik. Tks, agan seller."
    }
  ]

  return (
    <div className="testimoni-container">
      <h2 className="testimoni-heading">Testimoni Pelanggan</h2>
      <p className="testimoni-disclaimer">
        *Nama dan gambar profil telah disamarkan untuk menjaga privasi pelanggan
      </p>
      <div className="testimoni-grid">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="testimoni-card">
            <div className="testimoni-profile">
              <div className="testimoni-image-container">
                <Image 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="testimoni-image"
                  width={80}
                  height={80}
                />
              </div>
              <h3 className="testimoni-name">{testimonial.name}</h3>
            </div>
            <p className="testimoni-comment">&ldquo;{testimonial.comment}&rdquo;</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TestimoniSection