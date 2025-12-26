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
    email: z.email().optional(),
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
        globalSuccessToast(
          "Kode verifikasi telah dikirim ulang ke email Anda.",
        );
        setCode("");
      },
      onError: (error) => {
        globalErrorToast(error.message);
      },
    }),
  );

  const handleSendOTP = (): void => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      globalErrorToast("Tolong masukkan email yang valid.");
      return;
    }

    sendOTPMutation.mutate({ email });
  };

  const handleCodeChange = (value: string): void => {
    setCode(value);

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
      handleSendOTP();
    }
  }, [emailFromSearch]);

  // Success Screen
  if (step === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-10 text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-primary p-4">
                <CheckCircle2 className="h-14 w-14 text-primary-foreground" />
              </div>
            </div>
            <h2 className="mb-3 text-3xl font-bold text-foreground">
              Email Verified!
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Your email has been successfully verified.
              <br />
              Redirecting to your dashboard...
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // OTP Verification Screen
  if (step === "otp") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3 pb-6 text-center">
            <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-primary">
              <Mail className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-base">
              We've sent a 6-digit verification code to
              <br />
              <span className="text-lg font-semibold text-foreground">
                {email}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-center text-base font-medium text-foreground">
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
                <p className="text-center text-sm text-muted-foreground">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <Button
                onClick={() => handleVerify()}
                disabled={verifyMutation.isPending || code.length !== 6}
                className="h-12 w-full text-base font-semibold"
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
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Having trouble?
                </span>
              </div>
            </div>

            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={resendMutation.isPending}
                className="h-11 w-full font-medium"
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
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleBackToEmail}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Change Email
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By verifying your email, you agree to our Terms of Service and
              Privacy Policy
            </p>
          </CardFooter>
        </Card>

        <div className="fixed right-4 bottom-4 max-w-xs rounded-lg border bg-card p-4 shadow-lg">
          <p className="mb-2 text-sm font-semibold text-foreground">
            💡 Demo Instructions
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Enter{" "}
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono font-bold text-foreground">
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-primary">
            <Mail className="h-10 w-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-base">
            Enter your email address to receive a verification code
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
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
            <p className="text-xs text-muted-foreground">
              We'll send a 6-digit verification code to this email
            </p>
          </div>

          <Button
            onClick={handleSendOTP}
            disabled={sendOTPMutation.isPending || !email}
            className="h-12 w-full text-base font-semibold"
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
          <Button variant="ghost" className="w-full" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign Up
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardFooter>
      </Card>

      <div className="fixed right-4 bottom-4 max-w-xs rounded-lg border bg-card p-4 shadow-lg">
        <p className="mb-2 text-sm font-semibold text-foreground">
          💡 Demo Instructions
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Enter any valid email format to proceed to the OTP screen.
        </p>
      </div>
    </div>
  );
}
