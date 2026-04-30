import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type ContactLocale = "en" | "ar" | "fr" | "nl";

const CONTACT_TEXT: Record<
  ContactLocale,
  {
    errors: {
      required: string;
      invalidEmail: string;
      generic: string;
    };
    mail: {
      fromName: string;
      subjectPrefix: string;
      heading: string;
      subtitle: string;
      firstName: string;
      lastName: string;
      email: string;
      subject: string;
      message: string;
      footer: string;
      locale: string;
    };
  }
> = {
  en: {
    errors: {
      required: "All fields are required.",
      invalidEmail: "Invalid email address.",
      generic: "Failed to send the message. Please try again.",
    },
    mail: {
      fromName: "ReadyRoad Contact",
      subjectPrefix: "ReadyRoad Contact",
      heading: "New contact form submission",
      subtitle: "ReadyRoad contact form",
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      subject: "Subject",
      message: "Message",
      footer: "Sent from the ReadyRoad contact form",
      locale: "en-BE",
    },
  },
  ar: {
    errors: {
      required: "جميع الحقول مطلوبة.",
      invalidEmail: "عنوان البريد الإلكتروني غير صالح.",
      generic: "تعذر إرسال الرسالة. يرجى المحاولة مرة أخرى.",
    },
    mail: {
      fromName: "تواصل ReadyRoad",
      subjectPrefix: "رسالة تواصل من ReadyRoad",
      heading: "رسالة جديدة من نموذج التواصل",
      subtitle: "نموذج التواصل في ReadyRoad",
      firstName: "الاسم الأول",
      lastName: "اسم العائلة",
      email: "البريد الإلكتروني",
      subject: "الموضوع",
      message: "الرسالة",
      footer: "أُرسلت من نموذج التواصل في ReadyRoad",
      locale: "ar",
    },
  },
  fr: {
    errors: {
      required: "Tous les champs sont obligatoires.",
      invalidEmail: "Adresse e-mail invalide.",
      generic: "Impossible d'envoyer le message. Veuillez réessayer.",
    },
    mail: {
      fromName: "Contact ReadyRoad",
      subjectPrefix: "Message de contact ReadyRoad",
      heading: "Nouvelle demande via le formulaire de contact",
      subtitle: "Formulaire de contact ReadyRoad",
      firstName: "Prénom",
      lastName: "Nom",
      email: "E-mail",
      subject: "Objet",
      message: "Message",
      footer: "Envoyé depuis le formulaire de contact ReadyRoad",
      locale: "fr-BE",
    },
  },
  nl: {
    errors: {
      required: "Alle velden zijn verplicht.",
      invalidEmail: "Ongeldig e-mailadres.",
      generic: "Het bericht kon niet worden verzonden. Probeer het opnieuw.",
    },
    mail: {
      fromName: "ReadyRoad Contact",
      subjectPrefix: "ReadyRoad contactbericht",
      heading: "Nieuwe inzending via het contactformulier",
      subtitle: "ReadyRoad-contactformulier",
      firstName: "Voornaam",
      lastName: "Achternaam",
      email: "E-mail",
      subject: "Onderwerp",
      message: "Bericht",
      footer: "Verzonden via het ReadyRoad-contactformulier",
      locale: "nl-BE",
    },
  },
};

function resolveLocale(req: NextRequest): ContactLocale {
  const header = req.headers.get("accept-language")?.toLowerCase() ?? "";
  if (header.includes("ar")) return "ar";
  if (header.includes("fr")) return "fr";
  if (header.includes("nl")) return "nl";
  return "en";
}

export async function POST(req: NextRequest) {
  const locale = resolveLocale(req);
  const copy = CONTACT_TEXT[locale];

  try {
    const { firstName, lastName, email, subject, message } = await req.json();

    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: copy.errors.required },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: copy.errors.invalidEmail },
        { status: 400 },
      );
    }

    await transporter.sendMail({
      from: `"${copy.mail.fromName}" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_TO,
      replyTo: `"${firstName} ${lastName}" <${email}>`,
      subject: `[${copy.mail.subjectPrefix}] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #1e3a5f; margin-bottom: 4px;">${copy.mail.heading}</h2>
          <p style="color: #6b7280; font-size: 14px; margin-top: 0;">${copy.mail.subtitle}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 130px;">${copy.mail.firstName}:</td>
              <td style="padding: 8px 0; color: #111827;">${firstName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">${copy.mail.lastName}:</td>
              <td style="padding: 8px 0; color: #111827;">${lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">${copy.mail.email}:</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #374151;">${copy.mail.subject}:</td>
              <td style="padding: 8px 0; color: #111827;">${subject}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p style="font-weight: bold; color: #374151; margin-bottom: 8px;">${copy.mail.message}:</p>
          <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; color: #111827; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">${copy.mail.footer} • ${new Date().toLocaleString(copy.mail.locale, { timeZone: "Europe/Brussels" })}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: copy.errors.generic }, { status: 500 });
  }
}
