import React from "react";
import "./page.css";

const aboutVideoUrl =
  "https://v19-tkp-vod.tokopedia-static.net/b3a829119c302951572dcb937340f226/6a40461e/video/tos/alisg/tos-alisg-v-f466fc-sg/owYregQDnBlpTP8FECm04DQwCBnWfiig2FIbMU/?a=720074&bti=ZnVzc2Rnc253Zm0rYStmYmxsOg%3D%3D&&bt=472&ft=cAlnXYz7ThWHL2ReLGZmo0P&mime_type=video_mp4&rc=aTk1aTZkNjdnOTg6aWc7ZEBpMzxpOW45cm9ueDMzODRmNEAuMzMuLy9eXl8xMmFgXy9iYSNqcG5wMmQ0aTJgLS1kLy1zcw%3D%3D&vvpl=1&l=20260627235208ADC18846C229B70CA9D3&btag=e00078000";

function AboutSection() {
  return (
    <section
      className="about-section"
      aria-labelledby="about-heading"
      itemScope
      itemType="https://schema.org/Organization"
    >
      <div className="about-content">
        <p className="about-label">Tentang Eksotika Prima</p>
        <h2 id="about-heading" className="about-heading" itemProp="name">
          Supplier Minyak Gosok Terpercaya di Indonesia
        </h2>
        <p className="about-description" itemProp="description">
          Eksotika Prima adalah supplier minyak gosok, minyak urut, dan minyak pijat untuk kebutuhan pribadi, toko, reseller, dan pembelian grosir. Kami membantu pelanggan mendapatkan produk berkualitas dengan harga murah, packing aman, dan layanan cepat.
          <br/><br/>
          Produk-produk yang kami tawarkan diproduksi dengan standar kualitas yang baik dan menggabungkan bahan-bahan herbal pilihan yang telah lama dikenal dalam pengobatan tradisional Indonesia. Hal ini menjadikan produk Eksotika Prima sebagai pilihan bagi masyarakat yang menginginkan perawatan tubuh secara alami dengan kualitas yang terpercaya.
        </p>
        <div className="about-points" aria-label="Keunggulan Eksotika Prima">
          <span>Harga grosir</span>
          <span>Bisa nego</span>
          <span>Siap kirim</span>
        </div>
      </div>

      <div className="about-video-box">
        <video
          className="about-video"
          controls
          playsInline
          preload="metadata"
          aria-label="Video profil Eksotika Prima supplier minyak gosok"
        >
          <source src={aboutVideoUrl} type="video/mp4" />
          Browser Anda tidak bisa memutar video ini.
        </video>
      </div>
    </section>
  );
}

export default AboutSection;
