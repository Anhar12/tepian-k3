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
} from "@react-email/components";

interface WelcomeEmailProps {
  name?: string;
  dashboardUrl?: string;
}

export function WelcomeEmail({ name, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to our platform!</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-2xl rounded-lg bg-white p-8 shadow-lg">
            <Heading className="mb-6 text-3xl font-bold text-gray-900">
              Welcome{name ? `, ${name}` : ""}! 🎉
            </Heading>

            <Text className="mb-4 text-base text-gray-700">
              Thank you for signing up! We're excited to have you on board.
            </Text>

            <Text className="mb-6 text-base text-gray-700">
              Your account has been successfully created and verified. You can
              now access all features.
            </Text>

            {dashboardUrl && (
              <Section className="my-8 text-center">
                <Button
                  href={dashboardUrl}
                  className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white no-underline hover:bg-blue-700"
                >
                  Go to Dashboard
                </Button>
              </Section>
            )}

            <Text className="mb-4 text-sm text-gray-600">
              Need help getting started? Check out our documentation or contact
              support.
            </Text>

            <Section className="mt-8 border-t border-gray-200 pt-6">
              <Text className="text-xs text-gray-500">
                If you have any questions, feel free to reach out to our support
                team.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default WelcomeEmail;
