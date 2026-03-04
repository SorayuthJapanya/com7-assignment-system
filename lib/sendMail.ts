"use server";

import sgMail from "@sendgrid/mail";

type sendMailProps = {
  to: string;
  subject: string;
  html: string;
};

export const sendMail = async ({ to, subject, html }: sendMailProps) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  const msg = {
    to,
    from: {
      email: process.env.MAIL_FROM!,
      name: "COM7 Assignment System",
    },
    subject,
    html,
  };

  try {
    const response = await sgMail.send(msg);
    return response;
  } catch (error) {
    console.error("Send mail error:", error);
    return error;
  }
};
