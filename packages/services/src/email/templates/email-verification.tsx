import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  pixelBasedPreset,
} from "@react-email/components";

interface EmailVerificationProps {
  name?: string;
  verificationUrl: string;
  expiresInHours: number;
}

/** Renders the account email verification message. */
export function EmailVerification({
  name,
  verificationUrl,
  expiresInHours,
}: EmailVerificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Verifikasi email akun Anda</Preview>
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-2xl rounded-lg bg-white p-8">
            <Heading className="text-2xl font-bold text-gray-900">
              Verifikasi Email Akun Anda
            </Heading>
            <Text className="text-base text-gray-700">
              Halo{name ? ` ${name}` : ""}, silakan klik tombol berikut untuk
              memverifikasi alamat email dan mengaktifkan akun Anda.
            </Text>
            <Section className="my-8 text-center">
              <Button
                href={verificationUrl}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white no-underline"
              >
                Verifikasi Email
              </Button>
            </Section>
            <Text className="text-sm text-gray-600">
              Link ini berlaku selama {expiresInHours} jam dan hanya dapat
              digunakan satu kali. Jika Anda tidak merasa mendaftar, abaikan
              email ini.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default EmailVerification;
