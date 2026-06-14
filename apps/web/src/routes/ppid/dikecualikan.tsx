import LandingNavbar from "@/components/navbar";
import Footer from "@/components/footer";
import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/utils/page-head";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/ppid/dikecualikan")({
  component: PPIDDikecualikanPage,
  head: () => pageHead("Informasi Dikecualikan - PPID Balai K3 Samarinda"),
});

/**
 * Halaman Informasi Dikecualikan PPID.
 * Menampilkan daftar dokumen yang dikecualikan (rahasia/terbatas)
 * berdasarkan regulasi UU KIP No. 14 Tahun 2008.
 *
 * @returns {JSX.Element} Halaman Informasi Dikecualikan.
 */
function PPIDDikecualikanPage() {
  // Fetch excluded documents from tRPC if any
  const { data } = useQuery(
    trpc.platform.ppid.getPublicDocuments.queryOptions({
      category: "dikecualikan",
      page: 1,
      perPage: 10,
    }),
  );

  const dbDocuments = data?.data || [];

  // Default fallback/static items based on UU KIP Kemenaker standards from Figma
  const staticExcludedItems = [
    "Dokumen Data Pribadi Pegawai yang Dilindungi",
    "Dokumen Kepegawaian yang Mengandung Data Pribadi atau Informasi Sensitif",
    "Dokumen Hasil Pengujian yang Mengandung Rahasia atau Informasi Sensitif",
    "Dokumen Informasi Teknis Perusahaan yang Dilindungi",
    "Dokumen Data Keuangan yang Memuat Informasi Pribadi atau Sensitif",
    "Dokumen Sistem Internal dan Keamanan Digital",
  ];

  const displayDocuments =
    dbDocuments.length > 0
      ? dbDocuments.map((doc: any) => ({
          title: doc.title,
        }))
      : staticExcludedItems.map((title) => ({ title }));

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden overflow-y-auto bg-gradient-to-b from-[#EBF3FF]/30 via-white to-white dark:from-neutral-900/30 dark:via-neutral-950 dark:to-neutral-950">
      <LandingNavbar />

      <main className="container mx-auto flex flex-1 flex-col items-center space-y-12 px-4 py-16 md:px-8">
        {/* Badge: Informasi Publik */}
        <div className="inline-flex items-center justify-start gap-2.5">
          <div data-svg-wrapper>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                width="14"
                height="14"
                fill="url(#paint0_linear_1986_30014)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_1986_30014"
                  x1="0"
                  y1="7"
                  x2="14"
                  y2="7"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#1061D6" />
                  <stop offset="1" stopColor="#78E275" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="font-poppins text-xl leading-6 font-semibold text-blue-700 dark:text-blue-400">
            Informasi Publik
          </div>
        </div>

        {/* Title & Underline */}
        <div className="flex max-w-full flex-col items-center justify-center space-y-4 text-center">
          <h2 className="font-poppins text-4xl leading-tight font-bold tracking-tight text-blue-700 sm:text-5xl md:text-6xl dark:text-blue-400">
            Informasi Dikecualikan
          </h2>
          <div className="h-2.5 w-[80%] max-w-[617px] rounded-full bg-gradient-to-r from-blue-700 from-[34%] via-green-400 via-[58%] to-transparent" />
        </div>

        {/* Subtitle/Description */}
        <p className="font-poppins max-w-[1000px] text-center text-lg leading-relaxed font-medium text-neutral-600 md:text-2xl dark:text-neutral-400">
          Informasi yang tidak dapat diakses oleh publik karena bersifat rahasia
          atau dilindungi, sesuai dengan regulasi yang berlaku.
        </p>

        {/* Main Table Card */}
        <div className="w-full max-w-[1307px] rounded-[30px] bg-white p-4 shadow-[0px_0px_100px_-2px_rgba(16,97,214,0.14)] transition-all duration-300 sm:p-6 md:p-10 dark:bg-neutral-900">
          <div className="overflow-hidden rounded-[20px] bg-slate-50 p-1 md:p-2 dark:bg-neutral-950/40">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="h-20 rounded-t-[20px] bg-[#1061D6] text-white">
                    <th className="font-poppins w-24 rounded-tl-[18px] text-center text-xl font-semibold tracking-tight">
                      NO
                    </th>
                    <th className="font-poppins rounded-tr-[18px] px-6 text-left text-xl font-semibold tracking-tight">
                      Judul Dokumen
                    </th>
                  </tr>
                </thead>
                <tbody className="font-poppins divide-y divide-blue-600/20">
                  {displayDocuments.map((item, index) => (
                    <tr
                      key={index}
                      className="h-20 transition-colors hover:bg-blue-50/20 dark:hover:bg-neutral-900/30"
                    >
                      <td className="text-center text-xl font-normal text-neutral-600 dark:text-neutral-400">
                        {index + 1}.
                      </td>
                      <td className="px-6 text-xl leading-relaxed font-normal text-neutral-600 dark:text-neutral-300">
                        {item.title}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
