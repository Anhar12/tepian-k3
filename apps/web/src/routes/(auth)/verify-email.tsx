import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import z from "zod";
import { cn } from "@/lib/utils"; 
import { Separator } from "@/components/ui/separator"; 

export const Route = createFileRoute("/(auth)/verify-email")({
  validateSearch: z.object({
    email: z.email().optional(),
  }),
  component: VerifyEmailComponent,
});

const BannerImage = "/assets/banner-auth.png";

type Step = "email" | "otp" | "success";

function VerifyEmailComponent() {
  const { email: emailFromSearch } = Route.useSearch();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");

  const navigate = useNavigate();

  const sendOTPMutation = useMutation(
    trpc.auth.sendOTP.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Kode verifikasi telah dikirim ke email Anda.");
        setStep("otp");
      },
      onError: (error) => {
        globalErrorToast(error.message);
      },
    }),
  );

  const verifyMutation = useMutation(
    trpc.auth.verifyOTP.mutationOptions({
      onSuccess: async (data) => {
        setStep("success");
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        await queryClient.refetchQueries(trpc.auth.me.queryFilter());
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 2000);
      },
      onError: (error) => {
        globalErrorToast(error.message);
      },
    }),
  );

  const resendMutation = useMutation(
    trpc.auth.resendOTP.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Kode verifikasi telah dikirim ulang.");
        setCode("");
      },
      onError: (error) => {
        globalErrorToast(error.message);
      },
    }),
  );

  const handleSendOTP = (): void => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      globalErrorToast("Tolong masukkan email yang valid.");
      return;
    }
    sendOTPMutation.mutate({ email });
  };

  const handleCodeChange = (value: string): void => {
    setCode(value);
    if (value.length === 6) {
      handleVerify(value);
    }
  };

  const handleVerify = (codeValue: string = code): void => {
    if (codeValue.length !== 6) {
      globalErrorToast("Tolong masukkan kode verifikasi 6 digit.");
      return;
    }
    verifyMutation.mutate({ email, code: codeValue });
  };

  const handleResend = (): void => {
    setCode("");
    resendMutation.mutate({ email });
  };

  const handleBackToEmail = (): void => {
    setStep("email");
    setCode("");
  };

  const handleBack = (): void => {
    navigate({ to: "/register" });
  };

  useEffect(() => {
    if (emailFromSearch) {
      setEmail(emailFromSearch);
      setStep("otp");
      // Opsional: Uncomment jika ingin auto-send saat redirect dari register
      // handleSendOTP(); 
    }
  }, [emailFromSearch]);

  const renderHeader = () => {
    if (step === "success") {
      return (
        <div className="flex flex-col gap-1 text-center md:text-left">
          <h1 className="text-[#242321] text-[32px] font-semibold font-['Poppins'] leading-12">
            Berhasil!
          </h1>
          <p className="text-[#242321] text-[14px] font-medium font-['Poppins'] leading-5.25">
            Akun Anda telah diverifikasi.
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1 text-center md:text-left">
        <h1 className="text-[#242321] text-[32px] font-semibold font-['Poppins'] leading-12">
          Verifikasi Email
        </h1>
        <p className="text-[#242321] text-[14px] font-medium font-['Poppins'] leading-5.25">
          {step === "otp" ? "Masukkan kode keamanan" : "Amankan akun Anda"}
        </p>
      </div>
    );
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2 font-['Inter'] bg-[#F4F4F4]">
      
      <div className="hidden lg:block relative bg-[#F4F4F4] overflow-hidden">
        <img
          src={BannerImage}
          alt="Banner"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-r from-transparent to-[#F4F4F4]/20 pointer-events-none" />
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-10 items-center justify-center bg-[#F4F4F4] bg-grid-pattern relative border-l border-slate-200/50 min-h-svh lg:min-h-0">

        <div className="w-full max-w-100 flex flex-col gap-6">
          
          {renderHeader()}

          <Card className="border-slate-200 shadow-sm bg-white rounded-lg">
            
            {step === "success" && (
              <CardContent className="pt-10 pb-10 text-center flex flex-col items-center gap-6">
                <div className="rounded-full bg-green-50 p-4">
                  <CheckCircle2 className="h-14 w-14 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-[20px] font-semibold text-[#4D4D4D] font-['Poppins']">
                    Email Terverifikasi!
                  </h2>
                  <p className="text-[14px] text-[#64748B] font-['Poppins']">
                    Terima kasih telah memverifikasi email Anda. <br />
                    Mengalihkan ke dashboard...
                  </p>
                </div>
                <Loader2 className="h-8 w-8 animate-spin text-[#1061D6]" />
              </CardContent>
            )}

            {step === "otp" && (
              <>
                <CardHeader className="pb-6 pt-6 px-6 space-y-1">
                  <CardTitle className="text-[#4D4D4D] text-[20px] font-semibold font-['Poppins'] leading-6">
                    Masukkan Kode OTP
                  </CardTitle>
                  <CardDescription className="text-[#64748B] text-[14px] font-normal font-['Poppins'] leading-5.25">
                    Kami telah mengirimkan 6 digit kode ke <span className="font-semibold text-[#4D4D4D]">{email}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-6 space-y-6">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={code}
                      onChange={handleCodeChange}
                      disabled={verifyMutation.isPending}
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <InputOTPSlot 
                            key={index}
                            index={index} 
                            className="h-12 w-10 text-lg border-slate-200 rounded-md focus:border-[#1061D6] focus:ring-[#1061D6]" 
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    onClick={() => handleVerify()}
                    disabled={verifyMutation.isPending || code.length !== 6}
                    className="w-full bg-[#1061D6] hover:bg-blue-700 text-[#F8FAFC] text-[16px] font-semibold font-['Poppins'] h-10 rounded-lg"
                  >
                    {verifyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      "Verifikasi Email"
                    )}
                  </Button>

                  <div className="flex flex-col gap-3">
                    <Separator className="bg-slate-100" />
                    <div className="text-center text-[14px] font-['Poppins'] text-[#64748B]">
                      Tidak menerima kode?{" "}
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendMutation.isPending}
                        className="text-[#1061D6] font-medium hover:underline disabled:opacity-50"
                      >
                        {resendMutation.isPending ? "Mengirim..." : "Kirim Ulang"}
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleBackToEmail}
                      className="w-full text-[#64748B] hover:text-[#4D4D4D] font-['Poppins'] text-sm h-auto py-2"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Ganti alamat email
                    </Button>
                  </div>
                </CardContent>
              </>
            )}

            {step === "email" && (
              <>
                <CardHeader className="pb-6 pt-6 px-6 space-y-1">
                  <CardTitle className="text-[#4D4D4D] text-[20px] font-semibold font-['Poppins'] leading-6">
                    Alamat Email
                  </CardTitle>
                  <CardDescription className="text-[#64748B] text-[14px] font-normal font-['Poppins'] leading-5.25">
                    Masukkan email Anda untuk menerima kode verifikasi
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 pb-6 space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-[#4D4D4D] text-[16px] font-medium font-['Poppins']">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contoh@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendOTP();
                      }}
                      disabled={sendOTPMutation.isPending}
                      className="h-9 border-slate-200 rounded-lg focus-visible:ring-offset-0 focus-visible:ring-[#1061D6] font-['Poppins'] text-[14px]"
                    />
                  </div>

                  <Button
                    onClick={handleSendOTP}
                    disabled={sendOTPMutation.isPending || !email}
                    className="w-full bg-[#1061D6] hover:bg-blue-700 text-[#F8FAFC] text-[16px] font-semibold font-['Poppins'] h-9 rounded-lg"
                  >
                    {sendOTPMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      "Kirim Kode Verifikasi"
                    )}
                  </Button>

                  <div className="flex flex-col gap-3 pt-2">
                    <Separator className="bg-slate-100" />
                    <div className="text-center">
                      <Button 
                        variant="link" 
                        className="text-[#64748B] hover:text-[#1061D6] font-['Poppins'] text-sm no-underline hover:underline p-0 h-auto"
                        onClick={handleBack}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Halaman Daftar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            )}

          </Card>

          <div className="text-center text-xs text-slate-400 mt-2 font-['Inter']">
            💡 Hint: Gunakan email valid untuk menerima kode OTP.
          </div>

        </div>
      </div>
    </div>
  );
}