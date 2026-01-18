import React from "react";
import "./page.css";

function ReasonSection() {
  return (
    <div className="reason-container">
      <h2 className="reason-heading">Alasan Belanja di Toko Kami</h2>
      <div className="reason-grid">
        <div className="reason-card">
          <div className="reason-icon">💰</div>
          <h3 className="reason-title">Harga Termurah Se-Indonesia</h3>
          <p className="reason-description">
            Sebagai supplier terbesar, kami menawarkan harga yang paling
            kompetitif di seluruh Indonesia. Dapatkan kualitas terbaik dengan
            harga yang terjangkau tanpa mengurangi kualitas produk.
          </p>
        </div>
        <div className="reason-card">
          <div className="reason-icon">🐘</div>
          <h3 className="reason-title">Beli Banyak Nego Banyak</h3>
          <p className="reason-description">
            Semakin banyak Anda beli, semakin besar diskon yang Anda dapatkan!
            Harga bisa dinego untuk pembelian dalam jumlah besar. Hemat lebih
            banyak dengan belanja grosir.
          </p>
        </div>
        <div className="reason-card">
          <div className="reason-icon">📦</div>
          <h3 className="reason-title">Packing Aman Dan Berkualias</h3>
          <p className="reason-description">
            Kami menggunakan packaging yang aman dan berkualitas tinggi untuk
            memastikan produk sampai ke tangan Anda dalam kondisi terbaik.
            Setiap pesanan dikemas rapi, kuat, dan terlindungi agar tidak bocor
            maupun rusak selama pengiriman.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ReasonSection;
