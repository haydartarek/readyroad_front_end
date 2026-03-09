import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://readyroad.be';

export const metadata: Metadata = {
  title: 'Sign In | ReadyRoad',
  description:
    'Sign in or create your free ReadyRoad account to start preparing for the Belgian driving license theory exam.',
  alternates: { canonical: `${APP_URL}/login` },
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {children}
    </main>
  );
}
