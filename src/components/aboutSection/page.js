import React from "react";
import "./page.css";
import { getTranslations } from "@/lib/i18n";

const aboutYoutubeUrl = "https://www.youtube.com/embed/CkJjPNbH2K8";

function AboutSection({ locale = "id" }) {
  const text = getTranslations(locale).about;

  return (
    <section
      className="about-section"
      aria-labelledby="about-heading"
      itemScope
      itemType="https://schema.org/Organization"
    >
      <div className="about-content">
        <p className="about-label">{text.label}</p>
        <h2 id="about-heading" className="about-heading" itemProp="name">
          {text.heading}
        </h2>
        <div className="about-description" itemProp="description">
          {text.description.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="about-points" aria-label={text.pointsLabel}>
          {text.points.map((point) => (
            <span key={point}>{point}</span>
          ))}
        </div>
      </div>

      <div className="about-video-box">
        <iframe
          className="about-video"
          src={aboutYoutubeUrl}
          title={text.videoLabel}
          aria-label={text.videoLabel}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </section>
  );
}

export default AboutSection;
