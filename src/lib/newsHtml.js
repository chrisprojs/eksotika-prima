import { getLocalizedPath } from "@/lib/i18n";

const NEWS_ALLOWED_TAGS = new Set([
  "p", "br", "div", "span", "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
  "ul", "ol", "li", "dl", "dt", "dd", "a", "blockquote", "q", "cite", "code", "pre", "hr",
  "figure", "figcaption", "h1", "h2", "h3", "h4", "h5", "h6",
  "table", "caption", "thead", "tbody", "tfoot", "tr", "th", "td", "img",
]);

const PRODUCT_ALLOWED_TAGS = NEWS_ALLOWED_TAGS;

const VOID_TAGS = new Set(["br", "img"]);
const BLOCK_TAGS = NEWS_ALLOWED_TAGS;

const HTML_ENTITY_MAP = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  mdash: "-",
  nbsp: " ",
  ndash: "-",
  quot: '"',
};

function escapeAttribute(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeCodePoint(value, radix) {
  const codePoint = parseInt(value, radix);
  return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : "";
}

function decodeHtmlEntities(value = "") {
  return String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const normalizedEntity = entity.toLowerCase();

    if (normalizedEntity.startsWith("#x")) {
      return decodeCodePoint(normalizedEntity.slice(2), 16);
    }

    if (normalizedEntity.startsWith("#")) {
      return decodeCodePoint(normalizedEntity.slice(1), 10);
    }

    return HTML_ENTITY_MAP[normalizedEntity] || match;
  });
}

function isSafeRelativeUrl(url = "") {
  return (url.startsWith("/") && !url.startsWith("//")) || url.startsWith("#");
}

function isSafeUrl(value = "", { allowExternalLinks = true } = {}) {
  const url = String(value).trim();
  const lowerUrl = url.toLowerCase();

  if (!url || lowerUrl.startsWith("javascript:") || lowerUrl.startsWith("data:")) {
    return false;
  }

  if (isSafeRelativeUrl(url)) {
    return true;
  }

  return (
    allowExternalLinks &&
    (/^https?:\/\//i.test(url) || /^mailto:/i.test(url) || /^tel:/i.test(url))
  );
}

function parseAttributes(attributeText = "") {
  const attributes = {};
  const attributePattern = /([a-zA-Z:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match = attributePattern.exec(attributeText);

  while (match) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    attributes[name] = value;
    match = attributePattern.exec(attributeText);
  }

  return attributes;
}

function renderSafeTag(
  tagName,
  attributeText = "",
  { allowExternalLinks = true, allowImages = false } = {}
) {
  const attributes = parseAttributes(attributeText);

  if (tagName === "a") {
    const href = attributes.href;
    return href && isSafeUrl(href, { allowExternalLinks })
      ? `<a href="${escapeAttribute(href)}">`
      : "<a>";
  }

  if (tagName === "img" && allowImages) {
    const src = attributes.src;

    if (!src || !isSafeUrl(src, { allowExternalLinks: true })) {
      return "";
    }

    const alt = attributes.alt ? ` alt="${escapeAttribute(attributes.alt)}"` : "";
    return `<img src="${escapeAttribute(src)}"${alt} />`;
  }

  return `<${tagName}>`;
}

function sanitizeHtml(
  html = "",
  {
    allowedTags = PRODUCT_ALLOWED_TAGS,
    allowExternalLinks = false,
    allowImages = false,
  } = {}
) {
  return String(html)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>[\s\S]*?<\/embed>/gi, "")
    .replace(/<\/?([a-z][a-z0-9-]*)(\s[^<>]*)?>/gi, (match, rawTagName, attributeText = "") => {
      const tagName = rawTagName.toLowerCase();
      const isClosingTag = /^<\//.test(match);

      if (!allowedTags.has(tagName)) {
        return "";
      }

      if (isClosingTag) {
        return VOID_TAGS.has(tagName) ? "" : `</${tagName}>`;
      }

      return renderSafeTag(tagName, attributeText, {
        allowExternalLinks,
        allowImages,
      });
    });
}

export function cleanNewsHtml(html = "") {
  return sanitizeHtml(html, {
    allowedTags: NEWS_ALLOWED_TAGS,
    allowExternalLinks: true,
    allowImages: true,
  });
}

export function cleanProductHtml(html = "") {
  return sanitizeHtml(html, {
    allowedTags: PRODUCT_ALLOWED_TAGS,
    allowExternalLinks: false,
  });
}

export function htmlToPlainText(html = "") {
  return decodeHtmlEntities(
    cleanNewsHtml(html)
      .replace(/<\/?([a-z][a-z0-9-]*)(\s[^<>]*)?>/gi, (match, rawTagName) =>
        BLOCK_TAGS.has(rawTagName.toLowerCase()) ? " " : ""
      )
      .replace(/\s+/g, " ")
      .trim()
  );
}

export function localizeNewsHtml(html = "", locale = "id") {
  return cleanNewsHtml(html).replace(
    /href=(["'])\/(product|news)([^"']*)\1/gi,
    (match, quote, section, rest) =>
      `href=${quote}${getLocalizedPath(`/${section}${rest}`, locale)}${quote}`
  );
}
