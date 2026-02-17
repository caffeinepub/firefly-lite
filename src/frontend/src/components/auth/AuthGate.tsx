import { ReactNode } from 'react';
import { useGetCallerUserProfile } from '../../hooks/useFinanceQueries';
import ProfileSetupDialog from './ProfileSetupDialog';
import { Loader2 } from 'lucide-react';

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { data: userProfile, isLoading, isFetched } = useGetCallerUserProfile();

  const showProfileSetup = !isLoading && isFetched && userProfile === null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <ProfileSetupDialog open={showProfileSetup} />
      {children}
    </>
  );
}
