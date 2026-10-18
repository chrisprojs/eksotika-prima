import { jakartaTimeZone, parseUtcDate } from "@/lib/dateTime";
import { siteUrl } from "@/lib/site";

export const defaultLocale = "id";
export const englishLocale = "en";
export const locales = [defaultLocale, englishLocale];

export function normalizeLocale(locale) {
  return String(locale || "").toLowerCase() === englishLocale
    ? englishLocale
    : defaultLocale;
}

export function getLocaleFromPathname(pathname = "/") {
  return pathname === "/en" || pathname.startsWith("/en/")
    ? englishLocale
    : defaultLocale;
}

export function getPathWithoutLocale(pathname = "/") {
  if (pathname === "/en") {
    return "/";
  }

  if (pathname.startsWith("/en/")) {
    return pathname.replace(/^\/en/, "") || "/";
  }

  return pathname || "/";
}

export function getLocalizedPath(path = "/", locale = defaultLocale) {
  const normalizedLocale = normalizeLocale(locale);
  const safePath = path.startsWith("/") ? path : `/${path}`;
  const pathWithoutLocale = getPathWithoutLocale(safePath);

  if (normalizedLocale === englishLocale) {
    return pathWithoutLocale === "/" ? "/en" : `/en${pathWithoutLocale}`;
  }

  return pathWithoutLocale;
}

export function getLocalizedUrl(path = "/", locale = defaultLocale) {
  return `${siteUrl}${getLocalizedPath(path, locale)}`;
}

export function getMetadataAlternates(path = "/", locale = defaultLocale) {
  return {
    canonical: getLocalizedUrl(path, locale),
    languages: {
      "id-ID": getLocalizedUrl(path, defaultLocale),
      "en-US": getLocalizedUrl(path, englishLocale),
      "x-default": getLocalizedUrl(path, defaultLocale),
    },
  };
}

export function formatCurrency(price, currency = "IDR") {
  // IDR and JPY are whole-unit currencies; other foreign currencies (e.g. USD)
  // keep up to two decimals so small converted amounts stay readable.
  const fractionDigits = currency === "IDR" || currency === "JPY" ? 0 : 2;

  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(price)} ${currency}`;
}

export function formatLocalizedDate(date, locale = defaultLocale) {
  return new Intl.DateTimeFormat(
    normalizeLocale(locale) === englishLocale ? "en-US" : "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: jakartaTimeZone,
    }
  ).format(parseUtcDate(date));
}

const contactAddress =
  "Metro Indah III Blok.C No.31A RT.1/RW.4, Papanggo, Tanjung Priok, Jakarta Utara, DKI Jakarta, 14340";

export const dictionary = {
  id: {
    htmlLang: "id",
    nav: {
      home: "Beranda",
      products: "Produk",
      news: "Berita",
      contact: "Kontak",
      languageLabel: "Pilih bahasa",
      currencyLabel: "Pilih mata uang",
      indonesia: "ID",
      english: "EN",
    },
    footer: {
      contactUs: "Hubungi Kami:",
    },
    reminder: {
      prompt: "Mau Nego Atau Beli? Silakan Hubungi:",
    },
    home: {
      heroTitle: "Supplier Minyak Gosok Terbesar Se-Indonesia",
      heroSubtitle: "Harga Termurah, Bisa Nego",
      blast: "Beli Banyak Nego Banyak!",
      location: contactAddress,
      productsHeading: "Produk Kami",
    },
    about: {
      label: "Tentang Eksotika Prima",
      heading: "Situs Resmi & Supplier Minyak Gosok Terpercaya di Indonesia",
      description: [
        "Eksotika Prima adalah situs resmi dan supplier minyak gosok, minyak urut, minyak pijat, minyak kayu putih, dan balsem untuk kebutuhan pribadi, toko, reseller, dan pembelian grosir. Kami menyediakan produk asli dari brand ternama seperti Tawon, Beruang, Rejeki Jaya, dan Kuda Bangau dengan harga murah, packing aman, dan layanan cepat.",
        "Setiap produk yang kami jual diproduksi oleh pabrik resmi dengan bahan herbal pilihan yang telah lama dipercaya dalam perawatan tradisional Indonesia. Hal ini menjadikan Eksotika Prima pilihan utama bagi masyarakat yang mencari minyak gosok dan minyak kayu putih asli dengan kualitas terpercaya dan harga grosir.",
      ],
      points: ["Harga grosir", "Bisa nego", "Siap Impor"],
      pointsLabel: "Keunggulan Eksotika Prima",
      videoLabel: "Video Minyak Gosok Cap Beruang Roll On",
      videoFallback: "Browser Anda tidak bisa memutar video ini.",
    },
    importShipping: {
      label: "Layanan Impor",
      heading: "Melayani Pengiriman Minyak ke Berbagai Negara",
      description: [
        "Eksotika Prima melayani pengiriman minyak gosok, minyak urut, minyak pijat, minyak kayu putih, dan balsem dari brand Tawon, Beruang, Rejeki Jaya, dan Kuda Bangau untuk pembeli internasional. Kami membantu pelanggan, toko, reseller, dan pembeli grosir yang ingin mengirim produk ke luar Indonesia.",
        "Area tujuan dapat mencakup Amerika Serikat, Eropa, Australia, Asia Tenggara, Asia Timur, Timur Tengah, Afrika, Amerika Latin, dan wilayah lain sesuai aturan pengiriman yang berlaku. Tim kami membantu memberi informasi stok, packing, jumlah pesanan, dan proses pengiriman.",
      ],
      regionsLabel: "Wilayah tujuan impor",
      regions: [
        "Amerika Serikat",
        "Eropa",
        "Australia",
        "Asia Tenggara",
        "Asia Timur",
        "Timur Tengah",
        "Afrika",
        "Amerika Latin",
        "Lain-lain",
      ],
      noteTitle: "Siap Bantu Impor",
      noteText: "Diskusikan negara tujuan, jumlah pesanan, dan kebutuhan packing dengan tim kami.",
      imageAlt: "Minyak gosok dan minyak kayu putih Tawon, Beruang, Rejeki Jaya, dan Kuda Bangau dari Eksotika Prima siap pengiriman impor",
    },
    reason: {
      heading: "Alasan Belanja di Toko Kami",
      cards: [
        {
          icon: String.fromCodePoint(0x1f4b0),
          title: "Harga Termurah Se-Indonesia",
          description:
            "Sebagai supplier minyak gosok terbesar, kami menawarkan harga yang paling kompetitif di seluruh Indonesia. Dapatkan minyak gosok dan minyak kayu putih asli dengan harga terjangkau tanpa mengurangi kualitas produk.",
        },
        {
          icon: String.fromCodePoint(0x1f91d),
          title: "Beli Banyak Nego Banyak",
          description:
            "Semakin banyak Anda beli, semakin besar diskon yang Anda dapatkan! Harga bisa dinego untuk pembelian dalam jumlah besar. Hemat lebih banyak dengan belanja grosir.",
        },
        {
          icon: String.fromCodePoint(0x1f4e6),
          title: "Packing Aman dan Berkualitas",
          description:
            "Kami menggunakan packaging yang aman dan berkualitas tinggi untuk memastikan produk sampai ke tangan Anda dalam kondisi terbaik. Setiap pesanan dikemas rapi, kuat, dan terlindungi agar tidak bocor maupun rusak selama pengiriman.",
        },
      ],
    },
    faq: {
      label: "FAQ",
      heading: "Pertanyaan yang Sering Ditanyakan",
      description:
        "Jawaban singkat untuk pelanggan, toko, reseller, dan pembeli grosir.",
      items: [
        {
          question: "Apa itu Eksotika Prima?",
          answer:
            "Eksotika Prima adalah situs resmi dan supplier minyak gosok, minyak urut, minyak pijat, minyak kayu putih, dan balsem di Indonesia. Kami menjual produk asli dari brand Tawon, Beruang (Bear), Rejeki Jaya, dan Kuda Bangau untuk konsumen, toko, reseller, dan pembelian grosir, serta melayani pelanggan di seluruh Indonesia dan pembeli internasional sesuai aturan pengiriman yang berlaku.",
        },
        {
          question: "Apakah Eksotika Prima toko resmi untuk minyak Tawon, Beruang, Rejeki Jaya, dan Kuda Bangau?",
          answer:
            "Ya. Eksotika Prima adalah toko dan situs resmi yang menjual minyak gosok, minyak kayu putih, dan balsem asli dari brand Tawon, Beruang (Bear), Rejeki Jaya, dan Kuda Bangau. Semua produk kami bersumber langsung dan dijamin asli, bukan tiruan.",
        },
        {
          question: "Apakah produk minyak di Eksotika Prima 100% asli?",
          answer:
            "Ya. Semua minyak gosok, minyak kayu putih, minyak cengkeh, dan balsem yang dijual Eksotika Prima dijamin 100% asli dan bersumber dari produsen resmi masing-masing brand, yaitu Tawon, Beruang, Rejeki Jaya, dan Kuda Bangau.",
        },
        {
          question: "Brand apa saja yang tersedia di Eksotika Prima?",
          answer:
            "Eksotika Prima menyediakan produk dari empat brand utama: Tawon (diproduksi PT. Tawon Jaya Makassar), Beruang atau Bear (diproduksi PT. Granindo, Makassar), Rejeki Jaya (diproduksi UD Rejeki Jaya), dan Kuda Bangau (diproduksi Perusahaan Jamu Gunung Alam, Makassar-Sulawesi).",
        },
        {
          question: "Apa saja produk yang tersedia di Eksotika Prima?",
          answer:
            "Eksotika Prima menyediakan minyak gosok, minyak urut, minyak pijat, minyak kayu putih, minyak cengkeh, minyak angin, minyak telon, dan balsem. Produk tersedia dalam berbagai ukuran dan kemasan serta dapat dibeli satuan maupun grosir.",
        },
        {
          question: "Apa itu Minyak Cap Tawon dan apa kegunaannya?",
          answer:
            "Minyak Cap Tawon adalah minyak gosok tradisional produksi PT. Tawon Jaya Makassar yang umum dipakai untuk pijat, mengurut, serta memberi sensasi hangat pada badan. Eksotika Prima menyediakan Minyak Cap Tawon Reguler, Minyak Cap Tawon Super, dan Balsem Cap Tawon.",
        },
        {
          question: "Apa beda Minyak Cap Tawon Reguler dan Super?",
          answer:
            "Minyak Cap Tawon tersedia dalam varian Reguler dan Super. Varian Super umumnya memberi sensasi hangat yang lebih kuat dibanding varian Reguler. Detail ukuran dan pilihan kemasan tiap varian dapat dilihat pada halaman produk Eksotika Prima.",
        },
        {
          question: "Apa itu minyak gosok Cap Beruang (Bear)?",
          answer:
            "Minyak gosok Cap Beruang (Bear) diproduksi oleh PT. Granindo, Makassar. Di Eksotika Prima tersedia Balsem Cap Beruang, Minyak Gosok Cap Beruang (Reguler dan Super), Minyak Gosok Roll On Cap Beruang, dan Minyak Kayu Putih Cap Beruang Grizzly.",
        },
        {
          question: "Apa keunggulan Minyak Kayu Putih Rejeki Jaya dari Pulau Buru?",
          answer:
            "Minyak Kayu Putih Rejeki Jaya diproduksi UD Rejeki Jaya dan bahan bakunya bersumber dari Pulau Buru, Namlea, Ambon, yang dikenal sebagai sentra kayu putih. Tersedia dalam varian Reguler dan Super di Eksotika Prima.",
        },
        {
          question: "Apa itu minyak Cap Kuda Bangau?",
          answer:
            "Minyak Cap Kuda Bangau diproduksi oleh Perusahaan Jamu Gunung Alam, Makassar-Sulawesi. Eksotika Prima menyediakan Minyak Cengkeh Cap Kuda Bangau dan Minyak Kayu Putih Cap Kuda Bangau dalam varian Reguler dan Super.",
        },
        {
          question: "Bagaimana cara memesan produk di Eksotika Prima?",
          answer:
            "Pemesanan dapat dilakukan melalui WhatsApp yang tersedia di situs resmi Eksotika Prima. Tim kami membantu memberi informasi produk, harga, jumlah pesanan, dan proses pengiriman. Produk kami juga tersedia di Tokopedia, Shopee, dan Blibli.",
        },
        {
          question: "Apakah Eksotika Prima menyediakan harga grosir dan bisa nego?",
          answer:
            "Ya. Eksotika Prima adalah supplier grosir dan melayani pembelian dalam jumlah besar dengan harga lebih murah dibanding satuan. Harga bisa dinego, semakin banyak pembelian semakin besar potongan harganya. Hubungi tim penjualan untuk harga grosir dan minimum pemesanan.",
        },
        {
          question: "Apakah bisa beli minyak gosok grosir dari Indonesia untuk diekspor?",
          answer:
            "Bisa. Eksotika Prima melayani pembelian grosir untuk ekspor dan mendukung pengiriman internasional ke berbagai negara sesuai aturan yang berlaku. Prosesnya meliputi pemilihan produk, konfirmasi jumlah, persiapan dokumen, packing, lalu pengiriman via laut atau udara.",
        },
        {
          question: "Apakah Eksotika Prima menerima pengiriman internasional?",
          answer:
            "Ya. Eksotika Prima mendukung pengiriman ke Amerika Serikat, Eropa, Australia, Asia Tenggara, Asia Timur, Timur Tengah, Afrika, Amerika Latin, dan wilayah lain sesuai aturan pengiriman. Hubungi tim kami untuk tujuan pengiriman, ketersediaan produk, dan syarat impor.",
        },
        {
          question: "Apakah Eksotika Prima melayani seluruh Indonesia?",
          answer:
            "Ya. Eksotika Prima melayani pengiriman produk ke seluruh wilayah Indonesia. Layanan pengiriman disesuaikan dengan lokasi tujuan dan jenis pesanan.",
        },
        {
          question: "Di mana lokasi pusat Eksotika Prima?",
          answer:
            "Pusat operasional Eksotika Prima berlokasi di Metro Indah III Blok.C No.31A RT.1/RW.4, Papanggo, Tanjung Priok, Jakarta Utara, DKI Jakarta, 14340. Alamat lengkap, nomor telepon, dan WhatsApp dapat dilihat pada halaman Kontak.",
        },
        {
          question: "Mengapa memilih Eksotika Prima sebagai supplier minyak gosok?",
          answer:
            "Eksotika Prima adalah situs resmi dan salah satu supplier minyak gosok terbesar di Indonesia. Kami menjamin produk asli dari brand Tawon, Beruang, Rejeki Jaya, dan Kuda Bangau, menawarkan harga grosir yang bisa nego, stok memadai, packing aman, serta melayani pembelian eceran, grosir, dan ekspor.",
        },
      ],
    },
    shop: {
      heading: "Toko Kami Lainnya",
      tokopediaDetail: "26582 rating - 9990 ulasan",
      shopeeDetail: "35,5RB penilaian",
      blibliDetail: "241 ulasan",
    },
    testimonials: {
      heading: "Testimoni Pelanggan",
      disclaimer:
        "*Nama dan gambar profil telah disamarkan untuk menjaga privasi pelanggan",
      items: [
        {
          id: 1,
          name: "Ahmad S.",
          image: "/asset/testimoni_face/1.jpg",
          comment:
            "Langganan beli minyak tawon. Ini mungkin sudah ke berapa puluh kalinya saya beli. Semua bagus, packing oke.",
        },
        {
          id: 2,
          name: "Susi W.",
          image: "/asset/testimoni_face/2.jpg",
          comment:
            "Barang telah diterima dengan baik sesuai pesanan. Minyak tawon tutup putih selalu menjadi langganan.",
        },
        {
          id: 3,
          name: "Yoko R.",
          image: "/asset/testimoni_face/3.jpg",
          comment:
            "Saya suka minyak gosok cap Beruang. Sudah berulang kali pesan. Kalau sudah gosok telapak kaki, tidur bisa lebih nyenyak.",
        },
        {
          id: 4,
          name: "Dewi K.",
          image: "/asset/testimoni_face/4.jpg",
          comment:
            "Selalu puas beli di sini. Barang tidak pernah salah atau rusak. Bungkusnya juga aman.",
        },
        {
          id: 5,
          name: "Lina T.",
          image: "/asset/testimoni_face/5.jpg",
          comment:
            "Fast response, packing sangat rapi dan aman, cepat diproses dan dikirim. Barang sesuai deskripsi.",
        },
        {
          id: 6,
          name: "Rudi P.",
          image: "/asset/testimoni_face/6.jpg",
          comment:
            "Seller top. Pagi chat, langsung order. Setelah makan siang barang sudah diterima. Aman dan packing melindungi produk.",
        },
      ],
    },
    productList: {
      heading: "Cari Minyak Gosok Termurah Se-Indonesia",
      searchPlaceholder: "Cari Produk...",
    },
    productDetail: {
      priceTypeLabel: "Jenis Harga:",
      importPrice: "Harga Impor",
      localPrice: "Harga Lokal",
      quantityLabel: "Ukuran:",
      customQuantityLabel: "Jumlah custom:",
      customQuantityPlaceholder: "Masukkan jumlah",
      pieceSuffix: "pcs",
      variantLabel: "Paket:",
      brandLabel: "Merk:",
      producerLabel: "Produsen:",
      detailLabel: "Detail:",
      single: "satuan (1pcs)",
      dozen: "lusin (12 pcs)",
      dozenSuffix: "lusin (12pcs)",
      wholesale: "grosir",
      wholesaleSuffix: "grosir",
      wholesalePriceText: "Harga grosir nego via WhatsApp",
      priceLabel: "Harga",
      internationalShippingSuffix: "Mendukung Pengiriman Internasional",
      buyWhatsAppButton: "Beli via WhatsApp",
      buyWhatsAppMessage(productTitle, variantSize, quantityText, priceText) {
        return `Halo, saya mau beli ${productTitle} - ${variantSize} (${quantityText}). Harga: ${priceText}.`;
      },
      notFoundTitle: "Produk Tidak Ditemukan",
      notFoundDescription: "Produk tidak tersedia atau telah dihapus.",
    },
    news: {
      heading: "Berita",
      listDescription:
        "Info terbaru, tips, dan cerita produk dari Eksotika Prima.",
      empty: "Belum ada berita.",
      latestHeading: "Berita Terbaru",
      sectionText:
        "Baca info edukasi dan berita gokil terbaru dari Eksotika Prima.",
      readAll: "Lihat semua",
      education: "Edukasi",
      crazyNews: "Berita Gokil",
      productSectionHeading: "Berita Produk Ini",
      productSectionText:
        "Berita terbaru yang berhubungan dengan produk ini.",
      backToNews: "Kembali ke berita",
      relatedProductsTitle: "Produk terkait",
      noRelatedProducts: "Belum ada produk terkait.",
      seeProduct: "Lihat produk",
      priceUnavailable: "Harga belum tersedia",
      productPanelLabel: "Produk terkait",
      relatedProductCount(count) {
        return `${count} produk terkait`;
      },
      notFoundTitle: "Berita Tidak Ditemukan | Eksotika Prima",
      notFoundDescription: "Berita tidak tersedia atau sudah dihapus.",
    },
    meta: {
      home: {
        title: "Supplier Minyak Gosok Terbesar di Indonesia | Situs Resmi Eksotika Prima",
        description:
          "Situs resmi Eksotika Prima, supplier minyak gosok terbesar di Indonesia. Jual minyak gosok, minyak kayu putih & balsem asli Tawon, Beruang, Rejeki Jaya, Kuda Bangau. Harga grosir bisa nego, siap kirim ke seluruh dunia.",
        openGraphDescription:
          "Situs resmi & supplier grosir minyak gosok terbesar di Indonesia. Minyak gosok, minyak kayu putih, dan balsem asli Tawon, Beruang, Rejeki Jaya, Kuda Bangau. Harga nego, dukung pengiriman internasional.",
        keywords: [
          "Eksotika Prima",
          "situs resmi Eksotika Prima",
          "supplier minyak gosok",
          "grosir minyak gosok",
          "distributor minyak gosok",
          "jual minyak gosok asli",
          "minyak tawon",
          "balsem tawon",
          "minyak gosok beruang",
          "minyak kayu putih beruang",
          "minyak kayu putih rejeki jaya",
          "minyak kuda bangau",
          "minyak cengkeh kuda bangau",
          "minyak kayu putih",
          "minyak urut",
          "minyak pijat",
          "minyak gosok murah",
          "grosir minyak urut",
          "supplier minyak kayu putih",
          "minyak gosok terbesar Indonesia",
        ],
      },
      product: {
        title: "Jual Minyak Gosok Dan Balsem Asli | Situs Resmi Eksotika Prima",
        description:
          "Jual minyak gosok, minyak urut, minyak pijat, minyak kayu putih & balsem asli Tawon, Beruang, Rejeki Jaya, Kuda Bangau. Harga grosir termurah bisa nego, dukung pengiriman internasional.",
        twitterDescription:
          "Minyak gosok, minyak kayu putih & balsem asli Tawon, Beruang, Rejeki Jaya, Kuda Bangau. Harga grosir bisa nego di Eksotika Prima.",
        keywords: [
          "Eksotika Prima",
          "jual minyak gosok asli",
          "supplier minyak gosok",
          "grosir minyak gosok",
          "distributor minyak gosok",
          "minyak tawon",
          "minyak cap tawon super",
          "balsem tawon",
          "minyak gosok beruang",
          "minyak kayu putih beruang grizzly",
          "minyak kayu putih rejeki jaya",
          "minyak kuda bangau",
          "minyak cengkeh kuda bangau",
          "minyak kayu putih",
          "minyak urut",
          "minyak pijat",
          "balsem",
          "minyak gosok murah",
        ],
      },
      contact: {
        title: "Kontak & Pemesanan Minyak Gosok | Situs Resmi Eksotika Prima",
        description:
          "Hubungi Eksotika Prima, situs resmi supplier minyak gosok Tawon, Beruang, Rejeki Jaya & Kuda Bangau. Pesan via WhatsApp untuk harga grosir, nego, dan pengiriman internasional.",
      },
      news: {
        title: "Berita & Tips Minyak Gosok | Situs Resmi Eksotika Prima",
        description:
          "Baca berita, tips, dan info produk minyak gosok, minyak kayu putih, dan balsem dari Eksotika Prima, supplier resmi Tawon, Beruang, Rejeki Jaya, dan Kuda Bangau.",
      },
    },
  },
  en: {
    htmlLang: "en",
    nav: {
      home: "Home",
      products: "Products",
      news: "News",
      contact: "Contact",
      languageLabel: "Choose language",
      currencyLabel: "Choose currency",
      indonesia: "ID",
      english: "EN",
    },
    footer: {
      contactUs: "Contact Us:",
    },
    reminder: {
      prompt: "Want to bargain or buy? Please contact:",
    },
    home: {
      heroTitle: "Indonesia's Largest Massage Oil Supplier",
      heroSubtitle: "Low Prices, Open to Bargain",
      blast: "Buy More, Bargain More!",
      location: contactAddress,
      productsHeading: "Our Products",
    },
    about: {
      label: "About Eksotika Prima",
      heading: "Official Store & Trusted Massage Oil Supplier in Indonesia",
      description: [
        "Eksotika Prima is the official store and a leading supplier of Indonesian massage oil, rubbing oil, cajuput (eucalyptus) oil, and balm for personal use, shops, resellers, and wholesale buyers. We sell authentic products from trusted brands such as Tawon, Bear (Beruang), Rejeki Jaya, and Kuda Bangau with low prices, safe packing, and fast service.",
        "Every product we sell is made by its official producer using selected herbal ingredients long trusted in Indonesian traditional care. This makes Eksotika Prima a trusted choice for customers looking for genuine massage oil and cajuput oil at wholesale prices.",
      ],
      points: ["Wholesale price", "Can bargain", "Ready to import"],
      pointsLabel: "Eksotika Prima benefits",
      videoLabel: "Bear Massage Oil Roll On's Video",
      videoFallback: "Your browser cannot play this video.",
    },
    importShipping: {
      label: "Import Service",
      heading: "Shipping Oil Products to Many Countries",
      description: [
        "Eksotika Prima supports international shipping of massage oil, rubbing oil, cajuput (eucalyptus) oil, and balm from the Tawon, Bear (Beruang), Rejeki Jaya, and Kuda Bangau brands. We can help customers, stores, resellers, and wholesale buyers who want to send products outside Indonesia.",
        "Destination areas may include USA, Europe, Australia, Southeast Asia, East Asia, the Middle East, Africa, Latin America, and other regions based on available shipping rules. Our team helps with stock information, packing, order quantity, and shipping process details.",
      ],
      regionsLabel: "Import destination regions",
      regions: [
        "USA",
        "Europe",
        "Australia",
        "Southeast Asia",
        "East Asia",
        "Middle East",
        "Africa",
        "Latin America",
        "Others",
      ],
      noteTitle: "Import Support Ready",
      noteText: "Discuss destination country, order quantity, and packing needs with our team.",
      imageAlt: "Eksotika Prima Tawon, Bear, Rejeki Jaya, and Kuda Bangau massage and cajuput oils ready for import shipping",
    },
    reason: {
      heading: "Why Shop With Us",
      cards: [
        {
          icon: String.fromCodePoint(0x1f4b0),
          title: "Very Competitive Prices",
          description:
            "As a leading massage oil supplier, we offer competitive prices across Indonesia. You can get authentic massage oil and cajuput oil at affordable wholesale prices.",
        },
        {
          icon: String.fromCodePoint(0x1f91d),
          title: "Buy More, Bargain More",
          description:
            "The more you buy, the bigger the discount can be. Prices can be discussed for large orders, so wholesale shopping is more efficient.",
        },
        {
          icon: String.fromCodePoint(0x1f4e6),
          title: "Safe and Quality Packing",
          description:
            "We use safe and strong packaging so products arrive in good condition. Every order is packed neatly and protected from leaks or damage during delivery.",
        },
      ],
    },
    faq: {
      label: "FAQ",
      heading: "Frequently Asked Questions",
      description:
        "Short answers for customers, stores, resellers, and wholesale buyers.",
      items: [
        {
          question: "What is Eksotika Prima?",
          answer:
            "Eksotika Prima is the official store and a leading supplier of Indonesian massage oil, rubbing oil, cajuput (eucalyptus) oil, and balm. We sell authentic products from the Tawon, Bear (Beruang), Rejeki Jaya, and Kuda Bangau brands to personal customers, stores, resellers, and wholesale buyers across Indonesia, and we support international shipping based on shipping rules.",
        },
        {
          question: "Is Eksotika Prima the official store for Tawon, Bear, Rejeki Jaya, and Kuda Bangau oils?",
          answer:
            "Yes. Eksotika Prima is an official store and website selling authentic rubbing oil, cajuput oil, and balm from the Tawon, Bear (Beruang), Rejeki Jaya, and Kuda Bangau brands. Our products are sourced directly and guaranteed genuine, not counterfeit.",
        },
        {
          question: "Are the oils sold by Eksotika Prima 100% authentic?",
          answer:
            "Yes. All massage oils, cajuput oils, clove oils, and balms sold by Eksotika Prima are guaranteed 100% authentic and sourced from the official producers of each brand: Tawon, Bear (Beruang), Rejeki Jaya, and Kuda Bangau.",
        },
        {
          question: "Which brands are available at Eksotika Prima?",
          answer:
            "Eksotika Prima carries four main brands: Tawon (produced by PT. Tawon Jaya Makassar), Bear or Beruang (produced by PT. Granindo, Makassar), Rejeki Jaya (produced by UD Rejeki Jaya), and Kuda Bangau (produced by Perusahaan Jamu Gunung Alam, Makassar-Sulawesi).",
        },
        {
          question: "What products are available at Eksotika Prima?",
          answer:
            "Eksotika Prima offers rubbing oil, massage oil, cajuput (eucalyptus) oil, clove oil, wind oil, telon oil, and balm. Products come in different sizes and packaging and can be bought individually or wholesale.",
        },
        {
          question: "What is Tawon oil (Minyak Cap Tawon) used for?",
          answer:
            "Minyak Cap Tawon is a traditional Indonesian rubbing oil made by PT. Tawon Jaya Makassar, commonly used for massage and to give a warm, soothing sensation on the body. Eksotika Prima stocks Minyak Cap Tawon Regular, Minyak Cap Tawon Super, and Balsem (Balm) Cap Tawon.",
        },
        {
          question: "What is the difference between Tawon oil Regular and Super?",
          answer:
            "Tawon oil comes in Regular and Super variants. The Super variant generally delivers a stronger warming sensation than the Regular one. Size and packaging options for each variant are listed on the Eksotika Prima product pages.",
        },
        {
          question: "What is Bear brand (Beruang) rubbing oil?",
          answer:
            "Bear brand (Beruang) rubbing oil is produced by PT. Granindo, Makassar. Eksotika Prima stocks Bear Balm, Bear Rubbing Oil (Regular and Super), Bear Roll On Rubbing Oil, and Bear Grizzly Cajuput (eucalyptus) Oil.",
        },
        {
          question: "What makes Rejeki Jaya cajuput oil from Pulau Buru special?",
          answer:
            "Rejeki Jaya cajuput (eucalyptus) oil is produced by UD Rejeki Jaya, with raw material sourced from Pulau Buru, Namlea, Ambon, a well-known cajuput-producing region. It is available in Regular and Super variants at Eksotika Prima.",
        },
        {
          question: "What is Kuda Bangau oil?",
          answer:
            "Kuda Bangau oil is produced by Perusahaan Jamu Gunung Alam in Makassar-Sulawesi. Eksotika Prima stocks Kuda Bangau Clove Oil and Kuda Bangau Cajuput (eucalyptus) Oil in Regular and Super variants.",
        },
        {
          question: "How can I place an order with Eksotika Prima?",
          answer:
            "Orders can be placed through the WhatsApp contact on the official Eksotika Prima website. Our team helps with product information, pricing, order quantity, and shipping. Our products are also available on Tokopedia, Shopee, and Blibli.",
        },
        {
          question: "Does Eksotika Prima offer wholesale pricing and bargaining?",
          answer:
            "Yes. Eksotika Prima is a wholesale supplier and offers more competitive prices for bulk purchases than single items. Prices are negotiable, and larger orders get bigger discounts. Contact the sales team for wholesale prices and minimum order quantities.",
        },
        {
          question: "Can I buy massage oil wholesale from Indonesia for export?",
          answer:
            "Yes. Eksotika Prima serves wholesale export orders and supports international shipping to many countries based on applicable rules. The process covers product selection, quantity confirmation, document preparation, packing, and shipping by sea or air.",
        },
        {
          question: "Does Eksotika Prima offer international shipping?",
          answer:
            "Yes. Eksotika Prima supports shipping to the USA, Europe, Australia, Southeast Asia, East Asia, the Middle East, Africa, Latin America, and other regions based on shipping rules. Contact our team for destination countries, product availability, and import requirements.",
        },
        {
          question: "Does Eksotika Prima deliver throughout Indonesia?",
          answer:
            "Yes. Eksotika Prima delivers products across Indonesia. Shipping availability depends on the destination and the type of order.",
        },
        {
          question: "Where is Eksotika Prima located?",
          answer:
            "Eksotika Prima's main office is located at Metro Indah III Block C No. 31A, RT.1/RW.4, Papanggo, Tanjung Priok, North Jakarta, DKI Jakarta 14340, Indonesia. The full address, phone number, and WhatsApp contact are available on the Contact page.",
        },
        {
          question: "Why choose Eksotika Prima as your massage oil supplier?",
          answer:
            "Eksotika Prima is the official store and one of Indonesia's largest massage oil suppliers. We guarantee authentic products from Tawon, Bear (Beruang), Rejeki Jaya, and Kuda Bangau, offer negotiable wholesale prices, good stock, safe packing, and serve retail, wholesale, and export buyers.",
        },
      ],
    },
    shop: {
      heading: "Our Other Stores",
      tokopediaDetail: "26582 ratings - 9990 reviews",
      shopeeDetail: "35.5K ratings",
      blibliDetail: "241 reviews",
    },
    testimonials: {
      heading: "Customer Testimonials",
      disclaimer:
        "*Names and profile pictures are hidden to protect customer privacy",
      items: [
        {
          id: 1,
          name: "Ahmad S.",
          image: "/asset/testimoni_face/1.jpg",
          comment:
            "I often buy tawon oil here. I have ordered many times. Everything is good and the packing is okay.",
        },
        {
          id: 2,
          name: "Susi W.",
          image: "/asset/testimoni_face/2.jpg",
          comment:
            "The item arrived well and matched my order. The white-cap tawon oil is always my regular choice.",
        },
        {
          id: 3,
          name: "Yoko R.",
          image: "/asset/testimoni_face/3.jpg",
          comment:
            "I like Beruang massage oil. I have ordered many times. After massage it on my feet, I can sleep better.",
        },
        {
          id: 4,
          name: "Dewi K.",
          image: "/asset/testimoni_face/4.jpg",
          comment:
            "Always happy buying here. The item is never wrong or damaged. The package is also safe.",
        },
        {
          id: 5,
          name: "Lina T.",
          image: "/asset/testimoni_face/5.jpg",
          comment:
            "Fast response, neat and safe packing, fast process and delivery. The item matches the description.",
        },
        {
          id: 6,
          name: "Rudi P.",
          image: "/asset/testimoni_face/6.jpg",
          comment:
            "Great seller. I chatted in the morning and ordered right away. After lunch the item had arrived safely.",
        },
      ],
    },
    productList: {
      heading: "Find Affordable Massage Oil Products",
      searchPlaceholder: "Search products...",
    },
    productDetail: {
      priceTypeLabel: "Price Type:",
      importPrice: "Import Price",
      localPrice: "Local Price",
      quantityLabel: "Quantity:",
      customQuantityLabel: "Custom quantity:",
      customQuantityPlaceholder: "Enter quantity",
      pieceSuffix: "pcs",
      variantLabel: "Package:",
      brandLabel: "Brand:",
      producerLabel: "Producer:",
      detailLabel: "Detail:",
      single: "single (1pc)",
      dozen: "dozen (12 pcs)",
      dozenSuffix: "dozen (12pcs)",
      wholesale: "wholesale",
      wholesaleSuffix: "wholesale",
      wholesalePriceText: "Wholesale price: negotiate via WhatsApp",
      priceLabel: "Price",
      internationalShippingSuffix: "Support International Shipping",
      buyWhatsAppButton: "Buy via WhatsApp",
      buyWhatsAppMessage(productTitle, variantSize, quantityText, priceText) {
        return `Hello, I want to buy ${productTitle} - ${variantSize} (${quantityText}). Price: ${priceText}.`;
      },
      notFoundTitle: "Product Not Found",
      notFoundDescription: "This product is not available or has been removed.",
    },
    news: {
      heading: "News",
      listDescription:
        "Latest information, tips, and product stories from Eksotika Prima.",
      empty: "No news yet.",
      latestHeading: "Latest News",
      sectionText:
        "Read the latest education and crazy news from Eksotika Prima.",
      readAll: "View all",
      education: "Education",
      crazyNews: "Crazy News",
      productSectionHeading: "News About This Product",
      productSectionText: "Latest news related to this product.",
      backToNews: "Back to news",
      relatedProductsTitle: "Related products",
      noRelatedProducts: "No related products yet.",
      seeProduct: "View product",
      priceUnavailable: "Price is not available yet",
      productPanelLabel: "Related products",
      relatedProductCount(count) {
        return count === 1 ? "1 related product" : `${count} related products`;
      },
      notFoundTitle: "News Not Found | Eksotika Prima",
      notFoundDescription: "This news item is not available or has been removed.",
    },
    meta: {
      home: {
        title: "Largest Massage Oil Supplier in Indonesia | Eksotika Prima's Official Website",
        description:
          "Official Eksotika Prima store, Indonesia's largest massage oil supplier. Authentic Tawon, Bear, Rejeki Jaya & Kuda Bangau rubbing oil, cajuput oil & balm. Negotiable wholesale prices, worldwide shipping.",
        openGraphDescription:
          "Official store & largest wholesale massage oil supplier in Indonesia. Authentic Tawon, Bear, Rejeki Jaya & Kuda Bangau rubbing oil, cajuput oil & balm. Negotiable prices, international shipping.",
        keywords: [
          "Eksotika Prima",
          "official Eksotika Prima store",
          "massage oil supplier Indonesia",
          "wholesale massage oil supplier",
          "rubbing oil Indonesia",
          "Tawon oil",
          "Tawon balm",
          "Bear brand oil",
          "Beruang rubbing oil",
          "Rejeki Jaya cajuput oil",
          "Kuda Bangau oil",
          "clove oil Kuda Bangau",
          "cajuput oil",
          "eucalyptus oil",
          "massage oil wholesale Indonesia",
          "buy massage oil Indonesia",
          "authentic Indonesian massage oil",
          "herbal oil Indonesia",
        ],
      },
      product: {
        title: "Buy Authentic Massage Oil & Balm | Eksotika Prima's Official Website",
        description:
          "Buy authentic Tawon, Bear, Rejeki Jaya & Kuda Bangau massage oil, rubbing oil, cajuput oil & balm from Eksotika Prima. Low wholesale prices, negotiable, with international shipping.",
        twitterDescription:
          "Authentic Tawon, Bear, Rejeki Jaya & Kuda Bangau massage oil, cajuput oil & balm. Negotiable wholesale prices at Eksotika Prima.",
        keywords: [
          "Eksotika Prima",
          "buy massage oil Indonesia",
          "massage oil supplier",
          "wholesale massage oil",
          "rubbing oil Indonesia",
          "Tawon oil",
          "Bear brand oil",
          "Beruang rubbing oil",
          "Bear Grizzly cajuput oil",
          "Rejeki Jaya cajuput oil",
          "Kuda Bangau oil",
          "Kuda Bangau clove oil",
          "cajuput oil",
          "eucalyptus oil",
          "balm",
          "authentic Indonesian massage oil",
        ],
      },
      contact: {
        title: "Contact & Orders for Massage Oil | Eksotika Prima's Official Website",
        description:
          "Contact Eksotika Prima, the official store for Tawon, Bear, Rejeki Jaya & Kuda Bangau massage oil. Order via WhatsApp for wholesale prices, bargaining, and international shipping.",
      },
      news: {
        title: "Massage Oil News & Tips | Eksotika Prima's Official Website",
        description:
          "Read news, tips, and product info on massage oil, cajuput oil, and balm from Eksotika Prima, official supplier of Tawon, Bear, Rejeki Jaya, and Kuda Bangau.",
      },
    },
  },
};

export function getTranslations(locale = defaultLocale) {
  return dictionary[normalizeLocale(locale)];
}
