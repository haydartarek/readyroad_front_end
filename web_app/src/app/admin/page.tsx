import { redirect } from 'next/navigation';

/**
 * /admin → /admin/dashboard redirect
 *
 * Backward compatibility: visiting /admin redirects to /admin/dashboard.
 * This is a server component — instant redirect, no client JS needed.
 */
export default function AdminIndexRedirect() {
    redirect('/admin/dashboard');
}
