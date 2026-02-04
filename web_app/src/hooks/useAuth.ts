/**
 * useAuth Hook (Re-export from auth-context)
 * Provides centralized auth utilities and role checking
 * 
 * @author ReadyRoad Team
 * @since 2026-02-04
 */

export {
    useAuth,
    hasRole,
    hasAnyRole,
    isAdmin,
    isModerator,
    canModerate
} from '@/contexts/auth-context';
