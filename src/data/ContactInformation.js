export const ContactInformation = {
  tokopediaLink: "https://www.tokopedia.com/eksotikaprima",
  shopeeLink: "https://shopee.co.id/ivonrositawid",
  whatsappNumber: "+6285179646836"
};

export function formatPhoneNumber(phoneNumber) {
  // Format the phone number as desired, for example: +62 858-2485-3321
  return `${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3,6)}-${phoneNumber.slice(6, 10)}-${phoneNumber.slice(10, 14)}`;
}