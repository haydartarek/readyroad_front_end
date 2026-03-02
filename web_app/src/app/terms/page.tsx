'use client';

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────

interface TermsSection  { title: string; content: string; }
interface TermsContent  { title: string; lastUpdated: string; intro: string; sections: TermsSection[]; }

// ─── Content ────────────────────────────────────────────

const content: Record<string, TermsContent> = {
  en: {
    title: 'Terms of Service',
    lastUpdated: 'Last Updated: January 29, 2026',
    intro: 'Welcome to ReadyRoad. By accessing or using our mobile application and website, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.',
    sections: [
      { title: '1. Acceptance of Terms',          content: 'By creating an account or using ReadyRoad, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, you may not use our services.' },
      { title: '2. Eligibility',                  content: `To use ReadyRoad, you must:\n\n• Be at least 16 years old (minimum driving age requirement)\n• Provide accurate and complete registration information\n• Maintain the security of your account credentials\n• Not use the service for any illegal or unauthorized purpose` },
      { title: '3. User Accounts',                content: `Account Requirements:\n\n• You are responsible for maintaining the confidentiality of your password\n• You are responsible for all activities under your account\n• You must notify us immediately of any unauthorized access\n• We reserve the right to suspend or terminate accounts that violate these Terms` },
      { title: '4. Service Description',          content: `ReadyRoad provides:\n\n• Belgian driving license exam preparation materials\n• Practice tests and exam simulations\n• Traffic sign reference and lessons\n• Progress tracking and analytics\n• Multi-language support (EN, NL, FR, AR)\n\nWe reserve the right to modify, suspend, or discontinue any feature at any time.` },
      { title: '5. Content and Intellectual Property', content: `All content on ReadyRoad is the property of ReadyRoad or its licensors and is protected by copyright and intellectual property laws.\n\nYou may not:\n• Copy, modify, or distribute our content without permission\n• Reverse engineer or decompile the application\n• Remove copyright or proprietary notices\n• Use content for commercial purposes without authorization` },
      { title: '6. User Conduct',                 content: `You agree not to:\n\n• Upload or transmit viruses or malicious code\n• Attempt to gain unauthorized access to our systems\n• Interfere with or disrupt the service\n• Impersonate others or misrepresent your affiliation\n• Harvest or collect user information\n• Use automated systems to access the service (bots, scrapers)` },
      { title: '7. Exam Preparation Disclaimer',  content: `ReadyRoad is an exam preparation tool. We do not guarantee:\n\n• Passing of the official Belgian driving license exam\n• Accuracy of all information (official sources should be consulted)\n• Availability of service at all times\n\nUsers are responsible for verifying information with official Belgian driving authorities.` },
      { title: '8. Payment and Subscriptions',    content: `If applicable:\n\n• Subscription fees are billed in advance\n• Prices are subject to change with notice\n• No refunds for partial subscription periods\n• Cancellation does not entitle refunds for remaining period\n• Free trial terms are specified at registration` },
      { title: '9. Limitation of Liability',      content: `To the maximum extent permitted by law:\n\n• ReadyRoad is provided "as is" without warranties of any kind\n• We are not liable for indirect, incidental, or consequential damages\n• Our total liability shall not exceed the amount paid by you (if any)\n• We are not responsible for third-party content or services` },
      { title: '10. Indemnification',             content: 'You agree to indemnify and hold ReadyRoad harmless from any claims, damages, or expenses arising from your use of the service, violation of these Terms, or infringement of any rights of another party.' },
      { title: '11. Termination',                 content: `We may terminate or suspend your account immediately, without notice, for:\n\n• Violation of these Terms\n• Fraudulent or illegal activity\n• Extended inactivity\n• Request by law enforcement or regulatory authorities\n\nUpon termination, your right to use the service ceases immediately.` },
      { title: '12. Changes to Terms',            content: 'We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated date. Continued use after changes constitutes acceptance of the modified Terms.' },
      { title: '13. Governing Law',               content: 'These Terms are governed by the laws of Belgium. Any disputes shall be resolved in the courts of Belgium.' },
      { title: '14. Contact Information',         content: `For questions about these Terms:\n\nEmail: support@readyroad.be\nWebsite: https://readyroad.be\nAddress: [Your Business Address]` },
    ]
  },
  nl: {
    title: 'Servicevoorwaarden',
    lastUpdated: 'Laatst bijgewerkt: 29 januari 2026',
    intro: 'Welkom bij ReadyRoad. Door toegang te krijgen tot of gebruik te maken van onze mobiele applicatie en website, gaat u akkoord met deze Servicevoorwaarden.',
    sections: [
      { title: '1. Acceptatie van voorwaarden', content: 'Door een account aan te maken of ReadyRoad te gebruiken, erkent u dat u deze Voorwaarden en ons Privacybeleid hebt gelezen, begrepen en ermee akkoord gaat.' },
      { title: '2. In aanmerking komen',        content: 'Om ReadyRoad te gebruiken, moet u ten minste 16 jaar oud zijn, nauwkeurige registratie-informatie verstrekken en de beveiliging van uw accountgegevens handhaven.' },
      { title: '3. Contact',                    content: 'Voor vragen over deze voorwaarden: support@readyroad.be' },
    ]
  },
  fr: {
    title: "Conditions d'Utilisation",
    lastUpdated: 'Dernière mise à jour : 29 janvier 2026',
    intro: "Bienvenue sur ReadyRoad. En accédant ou en utilisant notre application mobile et notre site web, vous acceptez d'être lié par ces Conditions d'Utilisation.",
    sections: [
      { title: '1. Acceptation des conditions', content: "En créant un compte ou en utilisant ReadyRoad, vous reconnaissez avoir lu, compris et accepté ces Conditions et notre Politique de Confidentialité." },
      { title: '2. Éligibilité',               content: "Pour utiliser ReadyRoad, vous devez avoir au moins 16 ans, fournir des informations d'inscription exactes et maintenir la sécurité de vos identifiants de compte." },
      { title: '3. Contact',                   content: 'Pour toute question concernant ces conditions : support@readyroad.be' },
    ]
  },
  ar: {
    title: 'شروط الخدمة',
    lastUpdated: 'آخر تحديث: 29 يناير 2026',
    intro: 'مرحبًا بك في ReadyRoad. من خلال الوصول إلى تطبيق الهاتف المحمول وموقع الويب الخاص بنا أو استخدامهما، فإنك توافق على الالتزام بشروط الخدمة هذه.',
    sections: [
      { title: '1. قبول الشروط', content: 'من خلال إنشاء حساب أو استخدام ReadyRoad، فإنك تقر بأنك قد قرأت وفهمت ووافقت على الالتزام بهذه الشروط وسياسة الخصوصية الخاصة بنا.' },
      { title: '2. الأهلية',     content: 'لاستخدام ReadyRoad، يجب أن يكون عمرك 16 عامًا على الأقل، وتقديم معلومات تسجيل دقيقة، والحفاظ على أمان بيانات اعتماد حسابك.' },
      { title: '3. اتصل بنا',   content: 'للأسئلة حول هذه الشروط: support@readyroad.be' },
    ]
  },
};

// ─── Page ───────────────────────────────────────────────

export default function TermsPage() {
  const { language, isRTL } = useLanguage();
  const current = content[language] ?? content.en;

  return (
    <div className="container max-w-4xl py-10 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">

        {/* Header */}
        <CardHeader className="bg-muted/50 border-b border-border/40 px-6 py-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl font-black tracking-tight">
                {current.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{current.lastUpdated}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-8 space-y-8">
          {/* Intro */}
          <p className="text-base leading-relaxed text-muted-foreground border-l-4 border-primary/30 pl-4">
            {current.intro}
          </p>

          {/* Sections */}
          {current.sections.map((section, index) => (
            <div key={index} className="space-y-2">
              <h2 className="text-base font-black text-foreground">{section.title}</h2>
              <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                {section.content}
              </div>
              {index < current.sections.length - 1 && (
                <hr className="border-border/40 mt-4" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
