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

interface TTERequestEmailProps {
  signerName: string;
  documentName: string;
  tteLink: string;
}

export function TTERequestEmail({ signerName, documentName, tteLink }: TTERequestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Permintaan Tanda Tangan Elektronik (TTE) - {documentName}</Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-2xl rounded-lg bg-white p-8 shadow-lg">
            <Heading className="mb-6 text-2xl font-bold text-gray-900">
              Permohonan Tanda Tangan Elektronik
            </Heading>

            <Text className="mb-4 text-base text-gray-700">
              Yth. Bapak/Ibu <strong>{signerName}</strong>,
            </Text>

            <Text className="mb-4 text-base text-gray-700">
              Anda menerima permintaan untuk membubuhkan Tanda Tangan Elektronik (TTE) pada dokumen berikut:
            </Text>
            
            <Text className="mb-6 text-base font-semibold text-blue-700 bg-blue-50 p-3 rounded border border-blue-100">
              📄 {documentName}
            </Text>

            <Text className="mb-6 text-base text-gray-700">
              Silakan klik tombol di bawah ini untuk melihat dokumen dan membubuhkan tanda tangan elektronik Anda. Link ini aman dan hanya dapat diakses oleh Anda.
            </Text>

            <Section className="my-8 text-center">
              <Button
                href={tteLink}
                className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white no-underline hover:bg-blue-700"
              >
                Bubuhkan TTE Sekarang
              </Button>
            </Section>

            <Text className="mb-4 text-sm text-gray-600">
              Jika tombol di atas tidak berfungsi, Anda juga dapat menyalin tautan berikut ke browser Anda:
              <br />
              <a href={tteLink} className="text-blue-600 break-all">{tteLink}</a>
            </Text>

            <Section className="mt-8 border-t border-gray-200 pt-6">
              <Text className="text-xs text-gray-500">
                Email ini dikirim secara otomatis oleh Sistem Tepian K3. Mohon tidak membalas email ini.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default TTERequestEmail;
