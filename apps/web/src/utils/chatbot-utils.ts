export const formatWaNumber = (phone: string | null | undefined) => {
  if (!phone) return null;
  return `https://wa.me/${phone}`;
};

export const getBotResponse = (
  input: string,
  kbData: any[],
  waNumber: string | null | undefined,
  latestOrder?: any
): string => {
  const query = input.toLowerCase();

  if (
    latestOrder &&
    (query.includes("pesanan") || query.includes("order") || query.includes("status"))
  ) {
    return `Saat ini Anda memiliki pesanan **${latestOrder.orderNumber ?? latestOrder.code ?? latestOrder.id}** dengan status: **${latestOrder.status}**.`;
  }

  if (kbData && kbData.length > 0) {
    for (const item of kbData) {
      if (item.keywords.some((k: string) => query.includes(k.toLowerCase()))) {
        return item.answer;
      }
    }
  }

  const baseMsg =
    "Maaf, saya tidak menemukan jawaban yang sesuai di sistem saya. Untuk informasi lebih lanjut, silakan hubungi admin kami.";
  if (waNumber) {
    return `${baseMsg}\n\nKlik link berikut untuk menghubungi admin: ${formatWaNumber(waNumber)}`;
  }
  return baseMsg;
};
