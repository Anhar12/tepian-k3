import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from "@/components/login-form"

const BannerImage = "/assets/banner-auth.png"; 

export const Route = createFileRoute('/(auth)/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-[#F4F4F4]">
      <div className="hidden lg:block relative bg-[#F4F4F4] overflow-hidden">
        <img
          src={BannerImage}
          alt="Login Banner"

          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#F4F4F4]/20 pointer-events-none" />
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-10 items-center justify-center bg-[#F4F4F4] bg-grid-pattern relative border-l border-slate-200/50 min-h-svh lg:min-h-0">

        <div className="w-full max-w-[400px] flex flex-col gap-6">
          
          <div className="flex flex-col gap-1 text-center md:text-left">
            <h1 className="text-[#242321] text-[32px] font-semibold font-['Poppins'] leading-[48px]">
              Selamat Datang,
            </h1>
            <p className="text-[#242321] text-[14px] font-medium font-['Poppins'] leading-[21px]">
              Tepian K3 Samarinda
            </p>
          </div>

          <LoginForm />
        
        </div>
      </div>

    </div>
  )
}

export default LoginPage