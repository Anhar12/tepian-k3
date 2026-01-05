import { RegisterForm } from "@/components/register-form";
import { createFileRoute } from "@tanstack/react-router";

const BannerImage = "/assets/banner-auth.png"; 

export const Route = createFileRoute("/(auth)/register")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 font-['Inter'] bg-[#F4F4F4]">
      
      <div className="hidden lg:block relative bg-[#F4F4F4] overflow-hidden">
        <img
          src={BannerImage}
          alt="Register Banner"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-r from-transparent to-[#F4F4F4]/20 pointer-events-none" />
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-10 items-center justify-center bg-[#F4F4F4] bg-grid-pattern relative border-l border-slate-200/50 min-h-svh lg:min-h-0">

        <div className="w-full max-w-100 flex flex-col gap-6">
          
          <div className="flex flex-col gap-1 text-center md:text-left">
            <h1 className="text-[#242321] text-[32px] font-semibold font-['Poppins'] leading-12">
              Halo,
            </h1>
            <p className="text-[#242321] text-[14px] font-medium font-['Poppins'] leading-5.25">
              Silahkan lengkapi data diri Anda
            </p>
          </div>

          <RegisterForm />
        
        </div>
      </div>

    </div>
  );
}