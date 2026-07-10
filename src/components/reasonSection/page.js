import React from "react";
import "./page.css";
import { getTranslations } from "@/lib/i18n";

function ReasonSection({ locale = "id" }) {
  const text = getTranslations(locale).reason;

  return (
    <div className="reason-container">
      <h2 className="reason-heading">{text.heading}</h2>
      <div className="reason-grid">
        {text.cards.map((card) => (
          <div className="reason-card" key={card.title}>
            <div className="reason-icon" aria-hidden="true">
              {card.icon}
            </div>
            <h3 className="reason-title">{card.title}</h3>
            <p className="reason-description">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReasonSection;