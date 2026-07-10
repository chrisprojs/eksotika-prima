import { getLocalizedPath } from "@/lib/i18n";

export function cleanNewsHtml(html = "") {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export function localizeNewsHtml(html = "", locale = "id") {
  return cleanNewsHtml(html).replace(
    /href=(["'])\/(product|news)([^"']*)\1/gi,
    (match, quote, section, rest) =>
      `href=${quote}${getLocalizedPath(`/${section}${rest}`, locale)}${quote}`
  );
}