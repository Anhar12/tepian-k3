/**
 * Utility functions for masking sensitive data.
 */

export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const [localPart, domain] = email.split("@");
  if (!domain || !localPart) return email; // Not a valid email, return as is

  if (localPart.length <= 2) {
    return `${localPart}***@${domain}`;
  }

  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  const maskedLocal = `${firstChar}${"*".repeat(Math.max(1, localPart.length - 2))}${lastChar}`;

  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  
  // Clean phone number but keep '+' if it's there
  const hasPlus = phone.startsWith('+');
  const cleaned = phone.replace(/\D/g, ""); // digits only
  
  if (cleaned.length < 6) return phone;

  // e.g. +6281234567890 -> +6281****7890 or 0812****7890
  const prefixLen = hasPlus ? 5 : 4; 
  const prefix = phone.slice(0, prefixLen);
  const suffix = phone.slice(-4);
  const maskLength = phone.length - (prefixLen + 4);
  
  if (maskLength <= 0) return phone; // Fallback

  return `${prefix}${"*".repeat(maskLength)}${suffix}`;
}

export function maskName(name: string | null | undefined): string {
  if (!name) return "";
  
  const words = name.split(" ");
  return words.map(word => {
    if (word.length <= 2) return word;
    const firstChar = word[0];
    const lastChar = word[word.length - 1];
    return `${firstChar}${"*".repeat(Math.max(1, word.length - 2))}${lastChar}`;
  }).join(" ");
}

export function maskCompany(companyName: string | null | undefined): string {
  if (!companyName) return "";
  
  // Often company names have PT, CV, etc.
  const words = companyName.split(" ");
  return words.map((word, index) => {
    // Don't mask common prefixes if they are first
    if (index === 0 && ["pt", "pt.", "cv", "cv.", "ud", "ud.", "fa", "fa."].includes(word.toLowerCase())) {
      return word;
    }
    if (word.length <= 2) return word;
    const firstChar = word[0];
    const lastChar = word[word.length - 1];
    return `${firstChar}${"*".repeat(Math.max(1, word.length - 2))}${lastChar}`;
  }).join(" ");
}
