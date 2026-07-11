export const jakartaTimeZone = "Asia/Jakarta";

export function parseUtcDate(value) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "string") {
    return new Date(value);
  }

  const normalizedValue = value.trim();

  if (/([zZ]|[+-]\d{2}:?\d{2})$/.test(normalizedValue)) {
    return new Date(normalizedValue);
  }

  return new Date(`${normalizedValue.replace(" ", "T")}Z`);
}