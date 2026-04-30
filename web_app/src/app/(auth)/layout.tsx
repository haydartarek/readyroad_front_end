import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Access',
  description:
    'Sign in, register, or recover your ReadyRoad account to continue preparing for the Belgian driving theory exam.',
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
