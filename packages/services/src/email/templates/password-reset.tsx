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

interface PasswordResetEmailProps {
  resetLink: string;
  expiresInMinutes?: number;
}

export function PasswordResetEmail({
  resetLink,
  expiresInMinutes = 30,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto my-10 max-w-2xl rounded-lg bg-white p-8 shadow-lg">
            <Heading className="mb-6 text-2xl font-bold text-gray-900">
              Reset Your Password
            </Heading>

            <Text className="mb-4 text-base text-gray-700">
              We received a request to reset your password. Click the button
              below to create a new password:
            </Text>

            <Section className="my-8 text-center">
              <Button
                href={resetLink}
                className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white no-underline hover:bg-blue-700"
              >
                Reset Password
              </Button>
            </Section>

            <Text className="mb-4 text-sm text-gray-600">
              This link will expire in{" "}
              <strong>{expiresInMinutes} minutes</strong>.
            </Text>

            <Text className="mb-4 text-sm text-gray-600">
              If you didn't request a password reset, please ignore this email
              or contact support if you have concerns.
            </Text>

            <Section className="mt-8 border-t border-gray-200 pt-6">
              <Text className="text-xs text-gray-500">
                Or copy and paste this URL into your browser:
              </Text>
              <Text className="break-all text-xs text-blue-600">
                {resetLink}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default PasswordResetEmail;
