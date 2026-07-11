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

export function formatIdr(price, locale = defaultLocale) {
  if (normalizeLocale(locale) === englishLocale) {
    return `IDR ${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    }).format(price)}`;
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  })
    .format(price)
    .replace(/\s+/g, "");
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
      heading: "Supplier Minyak Gosok Terpercaya di Indonesia",
      description: [
        "Eksotika Prima adalah supplier minyak gosok, minyak urut, dan minyak pijat untuk kebutuhan pribadi, toko, reseller, dan pembelian grosir. Kami membantu pelanggan mendapatkan produk berkualitas dengan harga murah, packing aman, dan layanan cepat.",
        "Produk-produk yang kami tawarkan diproduksi dengan standar kualitas yang baik dan menggabungkan bahan-bahan herbal pilihan yang telah lama dikenal dalam pengobatan tradisional Indonesia. Hal ini menjadikan produk Eksotika Prima sebagai pilihan bagi masyarakat yang menginginkan perawatan tubuh secara alami dengan kualitas yang terpercaya.",
      ],
      points: ["Harga grosir", "Bisa nego", "Siap Ekspor"],
      pointsLabel: "Keunggulan Eksotika Prima",
      videoLabel: "Video profil Eksotika Prima supplier minyak gosok",
      videoFallback: "Browser Anda tidak bisa memutar video ini.",
    },
    reason: {
      heading: "Alasan Belanja di Toko Kami",
      cards: [
        {
          icon: String.fromCodePoint(0x1f4b0),
          title: "Harga Termurah Se-Indonesia",
          description:
            "Sebagai supplier terbesar, kami menawarkan harga yang paling kompetitif di seluruh Indonesia. Dapatkan kualitas terbaik dengan harga yang terjangkau tanpa mengurangi kualitas produk.",
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
      quantityLabel: "Ukuran:",
      variantLabel: "Paket:",
      brandLabel: "Merk:",
      producerLabel: "Produsen:",
      detailLabel: "Detail:",
      single: "satuan (1pcs)",
      dozen: "lusin (12 pcs)",
      dozenSuffix: "lusin (12pcs)",
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
        title: "Supplier Minyak Gosok Terbesar Se-Indonesia | Eksotika Prima",
        description:
          "Supplier minyak gosok terbesar di Indonesia. Menyediakan minyak gosok berkualitas dengan harga termurah dan bisa nego untuk pembelian besar.",
        openGraphDescription:
          "Supplier minyak gosok terbesar di Indonesia. Harga termurah, kualitas terjamin, bisa nego untuk pembelian besar.",
      },
      product: {
        title: "Cari Minyak Gosok Termurah Se-Indonesia | Eksotika Prima",
        description:
          "Cari minyak gosok termurah di Indonesia. Menyediakan minyak gosok berkualitas dengan harga termurah dan bisa nego untuk pembelian besar.",
        twitterDescription:
          "Supplier minyak gosok termurah. Kualitas terbaik dan bisa nego pembelian besar.",
      },
      contact: {
        title: "Kontak Kami | Eksotika Prima",
        description: "Kontak Kami | Eksotika Prima",
      },
      news: {
        title: "Berita | Eksotika Prima",
        description: "Baca berita dan info produk dari Eksotika Prima.",
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
      heroTitle: "Indonesia's Large Rubbing Oil Supplier",
      heroSubtitle: "Low Prices, Open to Bargain",
      blast: "Buy More, Bargain More!",
      location: contactAddress,
      productsHeading: "Our Products",
    },
    about: {
      label: "About Eksotika Prima",
      heading: "Trusted Rubbing Oil Supplier in Indonesia",
      description: [
        "Eksotika Prima supplies rubbing oil, massage oil, and herbal body care oil for personal use, shops, resellers, and wholesale buyers. We help customers get quality products with low prices, safe packing, and fast service.",
        "Our products are made with good quality standards and selected herbal ingredients that are well known in Indonesian traditional care. This makes Eksotika Prima a trusted choice for customers who want natural body care products.",
      ],
      points: ["Wholesale price", "Can bargain", "Ready to export"],
      pointsLabel: "Eksotika Prima benefits",
      videoLabel: "Eksotika Prima rubbing oil supplier profile video",
      videoFallback: "Your browser cannot play this video.",
    },
    reason: {
      heading: "Why Shop With Us",
      cards: [
        {
          icon: String.fromCodePoint(0x1f4b0),
          title: "Very Competitive Prices",
          description:
            "As a large supplier, we offer competitive prices across Indonesia. You can get good quality products at affordable prices.",
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
            "I like Beruang rubbing oil. I have ordered many times. After rubbing it on my feet, I can sleep better.",
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
      heading: "Find Affordable Rubbing Oil Products",
      searchPlaceholder: "Search products...",
    },
    productDetail: {
      quantityLabel: "Quantity:",
      variantLabel: "Package:",
      brandLabel: "Brand:",
      producerLabel: "Producer:",
      detailLabel: "Detail:",
      single: "single (1pc)",
      dozen: "dozen (12 pcs)",
      dozenSuffix: "dozen (12pcs)",
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
        title: "Indonesia Rubbing Oil Supplier | Eksotika Prima",
        description:
          "Eksotika Prima supplies quality rubbing oil and massage oil in Indonesia with low prices, safe packing, and wholesale order support.",
        openGraphDescription:
          "Quality rubbing oil supplier in Indonesia. Low prices, trusted quality, and wholesale orders can be discussed.",
      },
      product: {
        title: "Find Affordable Rubbing Oil Products | Eksotika Prima",
        description:
          "Find quality rubbing oil products from Eksotika Prima. Low prices, safe packing, and wholesale orders can be discussed.",
        twitterDescription:
          "Quality rubbing oil products with low prices and wholesale order support.",
      },
      contact: {
        title: "Contact Us | Eksotika Prima",
        description: "Contact Eksotika Prima through marketplace stores or WhatsApp.",
      },
      news: {
        title: "News | Eksotika Prima",
        description: "Read news and product information from Eksotika Prima.",
      },
    },
  },
};

export function getTranslations(locale = defaultLocale) {
  return dictionary[normalizeLocale(locale)];
}
