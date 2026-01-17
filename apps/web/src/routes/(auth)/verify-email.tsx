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
import { auth } from "@/utils/auth";

const validateEmailSchema = z.object({
  email: z.email().optional(),
});

export const Route = createFileRoute("/(auth)/verify-email")({
  validateSearch: validateEmailSchema,
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
        auth.setTokens(data.accessToken, data.refreshToken);
        await queryClient.refetchQueries(trpc.auth.me.queryFilter());
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 350);
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
    const res = validateEmailSchema.safeParse({ email });

    if (!res.success) {
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
          <h1 className="font-['Poppins'] text-[32px] leading-12 font-semibold text-[#242321]">
            Berhasil!
          </h1>
          <p className="font-['Poppins'] text-[14px] leading-5.25 font-medium text-[#242321]">
            Akun Anda telah diverifikasi.
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1 text-center md:text-left">
        <h1 className="font-['Poppins'] text-[32px] leading-12 font-semibold text-[#242321]">
          Verifikasi Email
        </h1>
        <p className="font-['Poppins'] text-[14px] leading-5.25 font-medium text-[#242321]">
          {step === "otp" ? "Masukkan kode keamanan" : "Amankan akun Anda"}
        </p>
      </div>
    );
  };

  return (
    <div className="grid min-h-svh bg-[#F4F4F4] font-['Inter'] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#F4F4F4] lg:block">
        <img
          src={BannerImage}
          alt="Banner"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent to-[#F4F4F4]/20" />
      </div>

      <div className="bg-grid-pattern relative flex min-h-svh flex-col items-center justify-center gap-4 border-l border-slate-200/50 bg-[#F4F4F4] p-6 md:p-10 lg:min-h-0">
        <div className="flex w-full max-w-100 flex-col gap-6">
          {renderHeader()}

          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            {step === "success" && (
              <CardContent className="flex flex-col items-center gap-6 pt-10 pb-10 text-center">
                <div className="rounded-full bg-green-50 p-4">
                  <CheckCircle2 className="h-14 w-14 text-green-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-['Poppins'] text-[20px] font-semibold text-[#4D4D4D]">
                    Email Terverifikasi!
                  </h2>
                  <p className="font-['Poppins'] text-[14px] text-[#64748B]">
                    Terima kasih telah memverifikasi email Anda. <br />
                    Mengalihkan ke dashboard...
                  </p>
                </div>
                <Loader2 className="h-8 w-8 animate-spin text-[#1061D6]" />
              </CardContent>
            )}

            {step === "otp" && (
              <>
                <CardHeader className="space-y-1 px-6 pt-6 pb-6">
                  <CardTitle className="font-['Poppins'] text-[20px] leading-6 font-semibold text-[#4D4D4D]">
                    Masukkan Kode OTP
                  </CardTitle>
                  <CardDescription className="font-['Poppins'] text-[14px] leading-5.25 font-normal text-[#64748B]">
                    Kami telah mengirimkan 6 digit kode ke{" "}
                    <span className="font-semibold text-[#4D4D4D]">
                      {email}
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 px-6 pb-6">
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
                            className="h-12 w-10 rounded-md border-slate-200 text-lg focus:border-[#1061D6] focus:ring-[#1061D6]"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    onClick={() => handleVerify()}
                    disabled={verifyMutation.isPending || code.length !== 6}
                    className="h-10 w-full rounded-lg bg-[#1061D6] font-['Poppins'] text-[16px] font-semibold text-[#F8FAFC] hover:bg-blue-700"
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
                    <div className="text-center font-['Poppins'] text-[14px] text-[#64748B]">
                      Tidak menerima kode?{" "}
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendMutation.isPending}
                        className="font-medium text-[#1061D6] hover:underline disabled:opacity-50"
                      >
                        {resendMutation.isPending
                          ? "Mengirim..."
                          : "Kirim Ulang"}
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleBackToEmail}
                      className="h-auto w-full py-2 font-['Poppins'] text-sm text-[#64748B] hover:text-[#4D4D4D]"
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
                <CardHeader className="space-y-1 px-6 pt-6 pb-6">
                  <CardTitle className="font-['Poppins'] text-[20px] leading-6 font-semibold text-[#4D4D4D]">
                    Alamat Email
                  </CardTitle>
                  <CardDescription className="font-['Poppins'] text-[14px] leading-5.25 font-normal text-[#64748B]">
                    Masukkan email Anda untuk menerima kode verifikasi
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 px-6 pb-6">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="font-['Poppins'] text-[16px] font-medium text-[#4D4D4D]"
                    >
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
                      className="h-9 rounded-lg border-slate-200 font-['Poppins'] text-[14px] focus-visible:ring-[#1061D6] focus-visible:ring-offset-0"
                    />
                  </div>

                  <Button
                    onClick={handleSendOTP}
                    disabled={sendOTPMutation.isPending || !email}
                    className="h-9 w-full rounded-lg bg-[#1061D6] font-['Poppins'] text-[16px] font-semibold text-[#F8FAFC] hover:bg-blue-700"
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
                        className="h-auto p-0 font-['Poppins'] text-sm text-[#64748B] no-underline hover:text-[#1061D6] hover:underline"
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

          <div className="mt-2 text-center font-['Inter'] text-xs text-slate-400">
            💡 Hint: Gunakan email valid untuk menerima kode OTP.
          </div>
        </div>
      </div>
    </div>
  );
}
