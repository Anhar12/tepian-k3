import { IconBook, IconFlask } from "@tabler/icons-react";

interface PortalSelectionProps {
  profileName: string;
  setActiveMode: (mode: "pengujian" | "pelatihan" | null) => void;
}

export function PortalSelection({
  profileName,
  setActiveMode,
}: PortalSelectionProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center font-['Poppins']">
      <div className="max-w-2xl space-y-3">
        <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold tracking-tight text-slate-800">
          Portal Administrasi Tepian K3
        </h1>
        <p className="text-sm text-slate-500">
          Selamat datang kembali,{" "}
          <span className="font-bold text-slate-800">{profileName}</span>!
          Silakan pilih modul administrasi yang ingin Anda kelola hari ini.
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-4xl gap-6 md:grid-cols-2">
        {/* Administrasi Pengujian Card */}
        <button
          type="button"
          onClick={() => {
            setActiveMode("pengujian");
          }}
          className="group relative flex cursor-pointer flex-col rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-sm transition-all duration-300 outline-none hover:-translate-y-1.5 hover:scale-[1.02] hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1061D6] transition-transform duration-300 group-hover:scale-110">
            <IconFlask className="size-6" />
          </div>
          <h3 className="mt-6 font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-800 transition-colors group-hover:text-[#1061D6]">
            Administrasi Pengujian Laboratorium
          </h3>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Kelola pesanan pengujian lab K3, verifikasi dokumen penawaran &
            pembayaran, tugaskan personil teknis, dan kelola instrumen worksheet
            laboratorium.
          </p>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#1061D6] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span>Masuk Modul</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </button>

        {/* Administrasi Pelatihan Card */}
        <button
          type="button"
          onClick={() => {
            setActiveMode("pelatihan");
          }}
          className="group relative flex cursor-pointer flex-col rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-sm transition-all duration-300 outline-none hover:-translate-y-1.5 hover:scale-[1.02] hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-110">
            <IconBook className="size-6" />
          </div>
          <h3 className="mt-6 font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-800 transition-colors group-hover:text-emerald-600">
            Administrasi Layanan Pelatihan
          </h3>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Kelola program e-learning, kelas bimtek, webinar K3, verifikasi
            pendaftaran peserta, kelola materi & kuis, serta terbitkan
            sertifikat digital.
          </p>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span>Masuk Modul</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
}
