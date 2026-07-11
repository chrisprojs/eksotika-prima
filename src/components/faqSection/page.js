import React from "react";
import { getTranslations } from "@/lib/i18n";
import "./page.css";

function FaqSection({ locale = "id" }) {
  const text = getTranslations(locale).faq;

  return (
    <section
      className="faq-section"
      aria-labelledby="faq-heading"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="faq-header">
        <p className="faq-label">{text.label}</p>
        <h2 id="faq-heading" className="faq-heading">
          {text.heading}
        </h2>
        <p className="faq-description">{text.description}</p>
      </div>

      <div className="faq-list">
        {text.items.map((item, index) => (
          <details
            className="faq-item"
            key={item.question}
            open={index === 0}
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
          >
            <summary className="faq-question">
              <span itemProp="name">{item.question}</span>
            </summary>
            <div
              className="faq-answer"
              itemScope
              itemProp="acceptedAnswer"
              itemType="https://schema.org/Answer"
            >
              <p itemProp="text">{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export default FaqSection;