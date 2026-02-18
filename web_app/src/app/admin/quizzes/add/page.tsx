import { redirect } from 'next/navigation';

/**
 * Legacy redirect: /admin/quizzes/add → /admin/quizzes/new
 * Backward compatibility — server component, instant redirect.
 */
export default function QuizzesAddRedirect() {
    redirect('/admin/quizzes/new');
}
