'use client';

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
    const { language } = useLanguage();

    const content = {
        en: {
            title: 'Terms of Service',
            lastUpdated: 'Last Updated: January 29, 2026',
            intro: 'Welcome to ReadyRoad. By accessing or using our mobile application and website, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.',
            sections: [
                {
                    title: '1. Acceptance of Terms',
                    content: 'By creating an account or using ReadyRoad, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, you may not use our services.'
                },
                {
                    title: '2. Eligibility',
                    content: `To use ReadyRoad, you must:

• Be at least 16 years old (minimum driving age requirement)
• Provide accurate and complete registration information
• Maintain the security of your account credentials
• Not use the service for any illegal or unauthorized purpose`
                },
                {
                    title: '3. User Accounts',
                    content: `Account Requirements:

• You are responsible for maintaining the confidentiality of your password
• You are responsible for all activities under your account
• You must notify us immediately of any unauthorized access
• We reserve the right to suspend or terminate accounts that violate these Terms`
                },
                {
                    title: '4. Service Description',
                    content: `ReadyRoad provides:

• Belgian driving license exam preparation materials
• Practice tests and exam simulations
• Traffic sign reference and lessons
• Progress tracking and analytics
• Multi-language support (EN, NL, FR, AR)

We reserve the right to modify, suspend, or discontinue any feature at any time.`
                },
                {
                    title: '5. Content and Intellectual Property',
                    content: `All content on ReadyRoad, including but not limited to text, graphics, logos, images, and software, is the property of ReadyRoad or its licensors and is protected by copyright and intellectual property laws.

You may not:
• Copy, modify, or distribute our content without permission
• Reverse engineer or decompile the application
• Remove copyright or proprietary notices
• Use content for commercial purposes without authorization`
                },
                {
                    title: '6. User Conduct',
                    content: `You agree not to:

• Upload or transmit viruses or malicious code
• Attempt to gain unauthorized access to our systems
• Interfere with or disrupt the service
• Impersonate others or misrepresent your affiliation
• Harvest or collect user information
• Use automated systems to access the service (bots, scrapers)`
                },
                {
                    title: '7. Exam Preparation Disclaimer',
                    content: `ReadyRoad is an exam preparation tool. We do not guarantee:

• Passing of the official Belgian driving license exam
• Accuracy of all information (official sources should be consulted)
• Availability of service at all times

Users are responsible for verifying information with official Belgian driving authorities.`
                },
                {
                    title: '8. Payment and Subscriptions',
                    content: `If applicable:

• Subscription fees are billed in advance
• Prices are subject to change with notice
• No refunds for partial subscription periods
• Cancellation does not entitle refunds for remaining period
• Free trial terms are specified at registration`
                },
                {
                    title: '9. Limitation of Liability',
                    content: `To the maximum extent permitted by law:

• ReadyRoad is provided "as is" without warranties of any kind
• We are not liable for indirect, incidental, or consequential damages
• Our total liability shall not exceed the amount paid by you (if any)
• We are not responsible for third-party content or services`
                },
                {
                    title: '10. Indemnification',
                    content: 'You agree to indemnify and hold ReadyRoad harmless from any claims, damages, or expenses arising from your use of the service, violation of these Terms, or infringement of any rights of another party.'
                },
                {
                    title: '11. Termination',
                    content: `We may terminate or suspend your account immediately, without notice, for:

• Violation of these Terms
• Fraudulent or illegal activity
• Extended inactivity
• Request by law enforcement or regulatory authorities

Upon termination, your right to use the service ceases immediately.`
                },
                {
                    title: '12. Changes to Terms',
                    content: 'We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated date. Continued use after changes constitutes acceptance of the modified Terms.'
                },
                {
                    title: '13. Governing Law',
                    content: 'These Terms are governed by the laws of Belgium. Any disputes shall be resolved in the courts of Belgium.'
                },
                {
                    title: '14. Contact Information',
                    content: `For questions about these Terms:

**Email**: support@readyroad.be
**Website**: https://readyroad.be
**Address**: [Your Business Address]`
                }
            ]
        },
        nl: {
            title: 'Servicevoorwaarden',
            lastUpdated: 'Laatst bijgewerkt: 29 januari 2026',
            intro: 'Welkom bij ReadyRoad. Door toegang te krijgen tot of gebruik te maken van onze mobiele applicatie en website, gaat u akkoord met deze Servicevoorwaarden.',
            sections: [
                {
                    title: '1. Acceptatie van voorwaarden',
                    content: 'Door een account aan te maken of ReadyRoad te gebruiken, erkent u dat u deze Voorwaarden en ons Privacybeleid hebt gelezen, begrepen en ermee akkoord gaat.'
                },
                {
                    title: '2. In aanmerking komen',
                    content: 'Om ReadyRoad te gebruiken, moet u ten minste 16 jaar oud zijn, nauwkeurige registratie-informatie verstrekken en de beveiliging van uw accountgegevens handhaven.'
                },
                {
                    title: '3. Contact',
                    content: 'Voor vragen over deze voorwaarden: support@readyroad.be'
                }
            ]
        },
        fr: {
            title: 'Conditions d\'Utilisation',
            lastUpdated: 'Dernière mise à jour : 29 janvier 2026',
            intro: 'Bienvenue sur ReadyRoad. En accédant ou en utilisant notre application mobile et notre site web, vous acceptez d\'être lié par ces Conditions d\'Utilisation.',
            sections: [
                {
                    title: '1. Acceptation des conditions',
                    content: 'En créant un compte ou en utilisant ReadyRoad, vous reconnaissez avoir lu, compris et accepté ces Conditions et notre Politique de Confidentialité.'
                },
                {
                    title: '2. Éligibilité',
                    content: 'Pour utiliser ReadyRoad, vous devez avoir au moins 16 ans, fournir des informations d\'inscription exactes et maintenir la sécurité de vos identifiants de compte.'
                },
                {
                    title: '3. Contact',
                    content: 'Pour toute question concernant ces conditions : support@readyroad.be'
                }
            ]
        },
        ar: {
            title: 'شروط الخدمة',
            lastUpdated: 'آخر تحديث: 29 يناير 2026',
            intro: 'مرحبًا بك في ReadyRoad. من خلال الوصول إلى تطبيق الهاتف المحمول وموقع الويب الخاص بنا أو استخدامهما، فإنك توافق على الالتزام بشروط الخدمة هذه.',
            sections: [
                {
                    title: '1. قبول الشروط',
                    content: 'من خلال إنشاء حساب أو استخدام ReadyRoad، فإنك تقر بأنك قد قرأت وفهمت ووافقت على الالتزام بهذه الشروط وسياسة الخصوصية الخاصة بنا.'
                },
                {
                    title: '2. الأهلية',
                    content: 'لاستخدام ReadyRoad، يجب أن يكون عمرك 16 عامًا على الأقل، وتقديم معلومات تسجيل دقيقة، والحفاظ على أمان بيانات اعتماد حسابك.'
                },
                {
                    title: '3. اتصل بنا',
                    content: 'للأسئلة حول هذه الشروط: support@readyroad.be'
                }
            ]
        }
    };

    const currentContent = content[language as keyof typeof content] || content.en;

    return (
        <div className="container max-w-4xl py-8 px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">{currentContent.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{currentContent.lastUpdated}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-base leading-relaxed">{currentContent.intro}</p>

                    {currentContent.sections.map((section, index) => (
                        <div key={index} className="space-y-2">
                            <h2 className="text-xl font-semibold">{section.title}</h2>
                            <div className="text-base leading-relaxed whitespace-pre-line">{section.content}</div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
