import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { UserRole } from '../backend';

export interface InvoicePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canMarkSent: boolean;
  canMarkPaid: boolean;
}

export function useGetCallerRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['callerRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useInvoicePermissions(): InvoicePermissions & { isLoading: boolean } {
  const { data: role, isLoading } = useGetCallerRole();

  if (isLoading || !role) {
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canMarkSent: false,
      canMarkPaid: false,
      isLoading: true,
    };
  }

  // Admin: full access
  if (role === UserRole.admin) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canMarkSent: true,
      canMarkPaid: true,
      isLoading: false,
    };
  }

  // Manager: create/edit/view (no delete)
  if (role === UserRole.user) {
    return {
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canMarkSent: true,
      canMarkPaid: true,
      isLoading: false,
    };
  }

  // Worker/Guest: view only
  return {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canMarkSent: false,
    canMarkPaid: false,
    isLoading: false,
  };
}
