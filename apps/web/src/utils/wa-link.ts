/**
 * Mengonversi nomor telepon ke URL wa.me
 * Menormalisasi format: 0812... → 62812...
 */
export function toWaLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const normalized = phone.replace(/^0/, "62").replace(/[^0-9]/g, "");
  return `https://wa.me/${normalized}`;
}
