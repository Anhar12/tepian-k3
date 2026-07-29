/**
 * Format tanggal dalam format DD-MM-YYYY (misal: 28-07-2026).
 *
 * @param dateInput - Date object, ISO string, atau timestamp number.
 * @returns String tanggal terformat DD-MM-YYYY atau "-" jika invalid.
 */
export function formatDateDDMMYYYY(
  dateInput?: Date | string | number | null,
): string {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Format waktu dalam format HH-MM-SS (misal: 14:30:00).
 *
 * @param dateInput - Date object, ISO string, atau timestamp number.
 * @returns String waktu terformat HH:MM:SS atau "-" jika invalid.
 */
export function formatTimeHHMMSS(
  dateInput?: Date | string | number | null,
): string {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "-";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Kombinasi format Tanggal DD-MM-YYYY HH:MM:SS
 */
export function formatDateTimeDDMMYYYY(
  dateInput?: Date | string | number | null,
): string {
  if (!dateInput) return "-";
  const dateStr = formatDateDDMMYYYY(dateInput);
  const timeStr = formatTimeHHMMSS(dateInput);
  if (dateStr === "-" || timeStr === "-") return "-";
  return `${dateStr} ${timeStr}`;
}

/**
 * Menghitung selisih waktu antara dua tanggal dan mengembalikan durasi terformat:
 * - `text`: Teks terformat Bahasa Indonesia (misal: "2 Hari 3 Jam 15 Menit 30 Detik")
 * - `formatted`: String terformat kompak "02d 03h 15m 30s"
 * - `totalSeconds`: Total selisih dalam detik
 */
export function calculateDurationBetween(
  startDateInput?: Date | string | number | null,
  endDateInput?: Date | string | number | null,
): {
  text: string;
  formatted: string;
  totalSeconds: number;
} {
  if (!startDateInput || !endDateInput) {
    return { text: "-", formatted: "-", totalSeconds: 0 };
  }

  const start = new Date(startDateInput).getTime();
  const end = new Date(endDateInput).getTime();

  if (isNaN(start) || isNaN(end) || end < start) {
    return { text: "-", formatted: "-", totalSeconds: 0 };
  }

  const totalSeconds = Math.floor((end - start) / 1000);

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} Hari`);
  if (hours > 0) parts.push(`${hours} Jam`);
  if (minutes > 0) parts.push(`${minutes} Menit`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} Detik`);

  const text = parts.join(" ");
  const formatted = `${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;

  return {
    text,
    formatted,
    totalSeconds,
  };
}
