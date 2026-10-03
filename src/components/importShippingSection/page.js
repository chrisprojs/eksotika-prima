import Image from "next/image";
import { getTranslations } from "@/lib/i18n";
import "./page.css";

const exportImageUrl = "/asset/ready_to_ship.jpg";

export default function ImportShippingSection({ locale = "id" }) {
  const text = getTranslations(locale).importShipping;

  return (
    <section className="import-shipping-section" aria-labelledby="import-shipping-heading">
      <div className="import-shipping-content">
        <p className="import-shipping-label">{text.label}</p>
        <h2 id="import-shipping-heading" className="import-shipping-heading">
          {text.heading}
        </h2>
        <div className="import-shipping-description">
          {text.description.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="import-shipping-regions" aria-label={text.regionsLabel}>
          {text.regions.map((region) => (
            <span key={region}>{region}</span>
          ))}
        </div>
        <div className="import-shipping-note">
          <strong>{text.noteTitle}</strong>
          <span>{text.noteText}</span>
        </div>
      </div>

      <div className="import-shipping-visual">
        <Image
          src={exportImageUrl}
          alt={text.imageAlt}
          className="import-shipping-image"
          width={900}
          height={600}
        />
      </div>
    </section>
  );
}