'use client';

import { useLanguage } from '@/contexts/language-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
    const { language } = useLanguage();

    const content = {
        en: {
            title: 'Privacy Policy',
            lastUpdated: 'Last Updated: January 29, 2026',
            intro: 'ReadyRoad ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.',
            sections: [
                {
                    title: '1. Information We Collect',
                    content: `We collect information that you provide directly to us:
          
• **Account Information**: Email address, username, and password (encrypted)
• **Progress Data**: Exam results, practice test scores, lessons completed, and analytics
• **Preferences**: Language selection, favorite traffic signs, and app settings
• **Usage Data**: App features used, session duration, and navigation patterns

We do not collect sensitive personal information such as government IDs, financial data, or precise geolocation.`
                },
                {
                    title: '2. How We Use Your Information',
                    content: `We use the collected information for:

• Providing and maintaining the ReadyRoad service
• Tracking your exam preparation progress
• Personalizing your learning experience
• Analyzing weak areas and error patterns
• Improving our services and user experience
• Communicating with you about updates and support
• Ensuring security and preventing fraud`
                },
                {
                    title: '3. Data Storage and Security',
                    content: `Your data security is our priority:

• All data is encrypted in transit using HTTPS/TLS
• Passwords are hashed and never stored in plain text
• Database access is restricted and monitored
• Regular security audits are performed
• We comply with GDPR and Belgian data protection laws`
                },
                {
                    title: '4. Data Sharing and Third Parties',
                    content: `We do not sell your personal information. We may share data only in these limited circumstances:

• **Service Providers**: Hosting and infrastructure providers bound by confidentiality agreements
• **Legal Requirements**: When required by law or to protect rights and safety
• **Business Transfers**: In case of merger or acquisition (users will be notified)

We do not share data with advertisers or marketing companies.`
                },
                {
                    title: '5. Your Rights (GDPR)',
                    content: `Under GDPR, you have the right to:

• **Access**: Request a copy of your personal data
• **Rectification**: Correct inaccurate or incomplete data
• **Erasure**: Request deletion of your account and data
• **Portability**: Receive your data in a structured format
• **Objection**: Object to processing of your data
• **Withdraw Consent**: Revoke consent at any time

To exercise these rights, contact us at privacy@readyroad.be`
                },
                {
                    title: '6. Data Retention',
                    content: `We retain your data for as long as your account is active. When you delete your account:

• Personal data is deleted within 30 days
• Anonymized usage statistics may be retained for analytics
• Legal requirements may necessitate longer retention for specific data types`
                },
                {
                    title: '7. Cookies and Tracking',
                    content: `We use essential cookies for:

• Authentication (session management)
• Language preferences
• Security features

We do not use advertising cookies or third-party tracking pixels.`
                },
                {
                    title: '8. Children\'s Privacy',
                    content: `ReadyRoad is intended for users aged 16 and older (driving age requirement). We do not knowingly collect data from children under 16. If we become aware of such collection, we will delete the information immediately.`
                },
                {
                    title: '9. International Data Transfers',
                    content: `Your data is primarily stored in EU data centers. If data is transferred outside the EU, we ensure adequate protection through:

• Standard contractual clauses
• Privacy Shield (where applicable)
• Adequate data protection safeguards`
                },
                {
                    title: '10. Changes to This Policy',
                    content: `We may update this Privacy Policy periodically. Changes will be posted on this page with an updated "Last Updated" date. Continued use of ReadyRoad after changes constitutes acceptance of the updated policy.`
                },
                {
                    title: '11. Contact Us',
                    content: `For privacy questions or concerns, contact us:

**Email**: privacy@readyroad.be
**Website**: https://readyroad.be
**Address**: [Your Business Address]

For data protection inquiries, you may also contact the Belgian Data Protection Authority (GBA).`
                }
            ]
        },
        nl: {
            title: 'Privacybeleid',
            lastUpdated: 'Laatst bijgewerkt: 29 januari 2026',
            intro: 'ReadyRoad ("wij", "ons" of "onze") zet zich in voor de bescherming van uw privacy. Dit privacybeleid legt uit hoe wij uw informatie verzamelen, gebruiken, openbaar maken en beschermen wanneer u onze mobiele applicatie en website gebruikt.',
            sections: [
                {
                    title: '1. Informatie die wij verzamelen',
                    content: 'Wij verzamelen informatie die u direct aan ons verstrekt: account informatie (e-mail, gebruikersnaam), voortgangsgegevens (examenuitslagen, oefentests), voorkeuren en gebruiksgegevens.'
                },
                {
                    title: '2. Hoe wij uw informatie gebruiken',
                    content: 'Wij gebruiken de verzamelde informatie voor het leveren van de ReadyRoad service, het bijhouden van uw voortgang, personalisatie van uw leerervaring en verbetering van onze diensten.'
                },
                {
                    title: '3. Gegevensopslag en beveiliging',
                    content: 'Alle gegevens worden versleuteld verzonden via HTTPS/TLS. Wachtwoorden worden gehasht en nooit in platte tekst opgeslagen. Wij voldoen aan de GDPR en Belgische gegevensbeschermingswetten.'
                },
                {
                    title: '4. Contact',
                    content: 'Voor privacyvragen: privacy@readyroad.be'
                }
            ]
        },
        fr: {
            title: 'Politique de Confidentialité',
            lastUpdated: 'Dernière mise à jour : 29 janvier 2026',
            intro: 'ReadyRoad ("nous", "notre" ou "nos") s\'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre application mobile et notre site web.',
            sections: [
                {
                    title: '1. Informations que nous collectons',
                    content: 'Nous collectons les informations que vous nous fournissez directement : informations de compte (email, nom d\'utilisateur), données de progression (résultats d\'examen, tests pratiques), préférences et données d\'utilisation.'
                },
                {
                    title: '2. Comment nous utilisons vos informations',
                    content: 'Nous utilisons les informations collectées pour fournir le service ReadyRoad, suivre vos progrès, personnaliser votre expérience d\'apprentissage et améliorer nos services.'
                },
                {
                    title: '3. Stockage et sécurité des données',
                    content: 'Toutes les données sont cryptées en transit via HTTPS/TLS. Les mots de passe sont hachés et jamais stockés en texte clair. Nous respectons le RGPD et les lois belges sur la protection des données.'
                },
                {
                    title: '4. Contact',
                    content: 'Pour les questions de confidentialité : privacy@readyroad.be'
                }
            ]
        },
        ar: {
            title: 'سياسة الخصوصية',
            lastUpdated: 'آخر تحديث: 29 يناير 2026',
            intro: 'تلتزم ReadyRoad ("نحن" أو "لنا") بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع معلوماتك واستخدامها والكشف عنها وحمايتها عند استخدام تطبيق الهاتف المحمول والموقع الإلكتروني الخاص بنا.',
            sections: [
                {
                    title: '1. المعلومات التي نجمعها',
                    content: 'نجمع المعلومات التي تقدمها لنا مباشرة: معلومات الحساب (البريد الإلكتروني، اسم المستخدم)، بيانات التقدم (نتائج الامتحان، الاختبارات التدريبية)، التفضيلات وبيانات الاستخدام.'
                },
                {
                    title: '2. كيف نستخدم معلوماتك',
                    content: 'نستخدم المعلومات المجمعة لتوفير خدمة ReadyRoad، وتتبع تقدمك، وتخصيص تجربة التعلم الخاصة بك، وتحسين خدماتنا.'
                },
                {
                    title: '3. تخزين البيانات والأمان',
                    content: 'يتم تشفير جميع البيانات أثناء النقل عبر HTTPS/TLS. يتم تجزئة كلمات المرور ولا يتم تخزينها أبدًا بنص عادي. نحن نلتزم بقانون GDPR وقوانين حماية البيانات البلجيكية.'
                },
                {
                    title: '4. اتصل بنا',
                    content: 'لأسئلة الخصوصية: privacy@readyroad.be'
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
