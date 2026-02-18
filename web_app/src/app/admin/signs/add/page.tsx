import { redirect } from 'next/navigation';

/**
 * Legacy redirect: /admin/signs/add → /admin/signs/new
 * Backward compatibility — server component, instant redirect.
 */
export default function SignsAddRedirect() {
    redirect('/admin/signs/new');
}
