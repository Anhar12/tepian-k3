import { emailService } from "../email";

async function verifyEmailConnection() {
  console.log("Verifying email connection...");
  const isVerified = await emailService.verify();

  if (isVerified) {
    console.log("✅ Email connection verified successfully!");
  } else {
    console.log("❌ Email connection failed. Check your configuration.");
  }

  process.exit(isVerified ? 0 : 1);
}

verifyEmailConnection();
