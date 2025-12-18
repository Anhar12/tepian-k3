import React from "react";
import {
  Body,
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

interface OTPEmailProps {
  code: string;
  expiresInMinutes: number;
}

export function OTPEmail({ code, expiresInMinutes }: OTPEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your verification code: {code}</Preview>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-2xl rounded-lg bg-white p-8 shadow-lg">
            <Heading className="mb-6 text-2xl font-bold text-gray-900">
              Your Verification Code
            </Heading>

            <Text className="mb-6 text-base text-gray-700">
              Use the following code to complete your login:
            </Text>

            <Section className="my-8 rounded-lg bg-gray-50 p-6 text-center">
              <Text className="m-0 text-4xl font-bold tracking-widest text-gray-900">
                {code}
              </Text>
            </Section>

            <Text className="mb-4 text-sm text-gray-600">
              This code will expire in{" "}
              <strong>{expiresInMinutes} minutes</strong>.
            </Text>

            <Text className="mb-4 text-sm text-gray-600">
              If you didn't request this code, please ignore this email.
            </Text>

            <Section className="mt-8 border-t border-gray-200 pt-6">
              <Text className="text-xs text-gray-500">
                This is an automated message, please do not reply.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default OTPEmail;
