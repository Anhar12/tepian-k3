import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/login-form";

const BannerImage = "/assets/banner-auth.png";

export const Route = createFileRoute("/(auth)/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="grid min-h-svh bg-[#F4F4F4] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#F4F4F4] lg:block">
        <img
          src={BannerImage}
          alt="Login Banner"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent to-[#F4F4F4]/20" />
      </div>

      <div className="bg-grid-pattern relative flex min-h-svh flex-col items-center justify-center gap-4 border-l border-slate-200/50 bg-[#F4F4F4] p-6 md:p-10 lg:min-h-0">
        <div className="flex w-full max-w-100 flex-col gap-6">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <h1 className="font-['Poppins'] text-[32px] leading-12 font-semibold text-[#242321]">
              Selamat Datang,
            </h1>
            <p className="font-['Poppins'] text-[14px] leading-5.25 font-medium text-[#242321]">
              Tepian K3 Samarinda
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
