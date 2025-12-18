import { Alert, AlertDescription } from "@/components/ui/alert";
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

export const Route = createFileRoute("/(auth)/verify-email")({
  validateSearch: z.object({
    email: z.string().email().optional(),
  }),
  component: VerifyEmailComponent,
});

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
    })
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
    })
  );

  // const resendMutation = useMockMutation(
  //   () => {
  //     setError("");
  //     setCode("");
  //     alert("Verification code resent to your email!");
  //   },
  //   (error: MutationError) => {
  //     setError(error.message);
  //   }
  // );

  const handleSendOTP = (): void => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      globalErrorToast("Tolong masukkan email yang valid.");
      return;
    }

    // In real app: sendOTPMutation.mutate({ email });
    sendOTPMutation.mutate({ email });
  };

  const handleCodeChange = (value: string): void => {
    setCode(value);
    //   setError("");

    // Auto-submit when all 6 digits entered
    if (value.length === 6) {
      handleVerify(value);
    }
  };

  const handleVerify = (codeValue: string = code): void => {
    if (codeValue.length !== 6) {
      globalErrorToast("Tolong masukkan kode verifikasi 6 digit.");
      return;
    }

    // In real app: verifyMutation.mutate({ email, code: codeValue });
    verifyMutation.mutate({ email, code: codeValue });
  };

  // const handleResend = (): void => {
  //   setCode("");
  //   // In real app: resendMutation.mutate({ email });
  //   resendMutation.mutate({ email });
  // };

  const handleBackToEmail = (): void => {
    setStep("email");
    setCode("");
  };

  const handleBack = (): void => {
    console.log("Going back to previous page...");
  };

  useEffect(() => {
    if (emailFromSearch) {
      setEmail(emailFromSearch);
      setStep("otp");
      handleSendOTP();
    }
  }, [emailFromSearch]);

  // Success Screen
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-8 pb-10 text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-linear-to-br from-green-400 to-emerald-500 p-4 shadow-lg">
                <CheckCircle2 className="h-14 w-14 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 text-gray-900">
              Email Verified!
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Your email has been successfully verified.
              <br />
              Redirecting to your dashboard...
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // OTP Verification Screen
  if (step === "otp") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              We've sent a 6-digit verification code to
              <br />
              <span className="font-semibold text-gray-900 text-lg">
                {email}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-center block text-base font-medium text-gray-700">
                  Enter verification code
                </label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={handleCodeChange}
                    disabled={verifyMutation.isPending}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-14 w-12 text-xl" />
                      <InputOTPSlot index={1} className="h-14 w-12 text-xl" />
                      <InputOTPSlot index={2} className="h-14 w-12 text-xl" />
                      <InputOTPSlot index={3} className="h-14 w-12 text-xl" />
                      <InputOTPSlot index={4} className="h-14 w-12 text-xl" />
                      <InputOTPSlot index={5} className="h-14 w-12 text-xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-center text-sm text-gray-600">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <Button
                onClick={() => handleVerify()}
                disabled={verifyMutation.isPending || code.length !== 6}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                size="lg"
              >
                {verifyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Having trouble?
                </span>
              </div>
            </div>

            {/* <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={resendMutation.isPending}
                  className="w-full h-11 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-medium"
                >
                  {resendMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Code"
                  )}
                </Button>
              </div> */}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-900"
              onClick={handleBackToEmail}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Change Email
            </Button>

            <p className="text-xs text-center text-gray-500">
              By verifying your email, you agree to our Terms of Service and
              Privacy Policy
            </p>
          </CardFooter>
        </Card>

        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-xl border max-w-xs">
          <p className="text-sm font-semibold mb-2 text-gray-900">
            💡 Demo Instructions
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Enter{" "}
            <span className="font-mono font-bold bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">
              123456
            </span>{" "}
            to verify successfully.
          </p>
        </div>
      </div>
    );
  }

  // Email Input Screen (Default)
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Mail className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Enter your email address to receive a verification code
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendOTP();
                }
              }}
              disabled={sendOTPMutation.isPending}
              className="h-12 text-base"
            />
            <p className="text-xs text-gray-500">
              We'll send a 6-digit verification code to this email
            </p>
          </div>

          <Button
            onClick={handleSendOTP}
            disabled={sendOTPMutation.isPending || !email}
            className="w-full h-12 text-base font-semibold bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            size="lg"
          >
            {sendOTPMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending Code...
              </>
            ) : (
              "Send Verification Code"
            )}
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            variant="ghost"
            className="w-full text-gray-600 hover:text-gray-900"
            onClick={handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign Up
          </Button>

          <p className="text-xs text-center text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>

      <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-xl border max-w-xs">
        <p className="text-sm font-semibold mb-2 text-gray-900">
          💡 Demo Instructions
        </p>
        <p className="text-xs text-gray-600 leading-relaxed">
          Enter any valid email format to proceed to the OTP screen.
        </p>
      </div>
    </div>
  );
}
