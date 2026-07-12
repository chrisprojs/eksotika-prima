import Image from "next/image";
import { getTranslations } from "@/lib/i18n";
import "./page.css";

const exportImageUrl = "/asset/ready_to_ship.jpg";

export default function ExportShippingSection({ locale = "id" }) {
  const text = getTranslations(locale).exportShipping;

  return (
    <section className="export-shipping-section" aria-labelledby="export-shipping-heading">
      <div className="export-shipping-content">
        <p className="export-shipping-label">{text.label}</p>
        <h2 id="export-shipping-heading" className="export-shipping-heading">
          {text.heading}
        </h2>
        <div className="export-shipping-description">
          {text.description.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="export-shipping-regions" aria-label={text.regionsLabel}>
          {text.regions.map((region) => (
            <span key={region}>{region}</span>
          ))}
        </div>
        <div className="export-shipping-note">
          <strong>{text.noteTitle}</strong>
          <span>{text.noteText}</span>
        </div>
      </div>

      <div className="export-shipping-visual">
        <Image
          src={exportImageUrl}
          alt={text.imageAlt}
          className="export-shipping-image"
          width={900}
          height={600}
        />
      </div>
    </section>
  );
}