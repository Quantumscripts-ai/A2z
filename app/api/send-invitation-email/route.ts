import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Disable SSL verification for development (fixes self-signed certificate issues)
if (process.env.NODE_ENV === "development") {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
}

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const { to, teamName, inviterName, invitationToken } = await request.json();

    if (!to || !teamName || !inviterName || !invitationToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const acceptUrl = baseUrl + "/invite/accept?token=" + invitationToken;
    const declineUrl = baseUrl + "/invite/decline?token=" + invitationToken;

    const emailText =
      "Hello! " +
      inviterName +
      " has invited you to join the team '" +
      teamName +
      "' on TranslateA2Z. To accept: " +
      acceptUrl +
      " To decline: " +
      declineUrl;

    const emailHtml =
      "<h1>TranslateA2Z Team Invitation</h1><p>Hello!</p><p><strong>" +
      inviterName +
      "</strong> has invited you to join the team <strong>'" +
      teamName +
      "'</strong> on TranslateA2Z.</p><p><a href='" +
      acceptUrl +
      "' style='background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;'>Accept Invitation</a></p><p><a href='" +
      declineUrl +
      "' style='background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;'>Decline Invitation</a></p>";

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        {
          error:
            "Email service not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD.",
          requiresSetup: true,
        },
        { status: 500 }
      );
    }

    try {
      const transporter = createTransporter();
      const info = await transporter.sendMail({
        from: '"TranslateA2Z" <' + process.env.GMAIL_USER + ">",
        to: to,
        subject: "Invitation to join " + teamName + " on TranslateA2Z",
        text: emailText,
        html: emailHtml,
      });

      console.log("Email sent successfully:", info.messageId);
      return NextResponse.json({
        success: true,
        message: "Invitation email sent successfully",
        messageId: info.messageId,
        acceptUrl: acceptUrl,
        declineUrl: declineUrl,
      });
    } catch (emailError) {
      console.error("Nodemailer error:", emailError);
      return NextResponse.json(
        {
          error: "Failed to send email: " + (emailError as Error).message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return NextResponse.json(
      { error: "Failed to send invitation email" },
      { status: 500 }
    );
  }
}
