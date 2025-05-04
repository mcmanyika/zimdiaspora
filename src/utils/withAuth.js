/* eslint-disable react/display-name */
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const withAuth = (WrappedComponent, requiredRoles = null) => {
  return function WithAuthComponent(props) {
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const supabase = useMemo(() => createClientComponentClient(), []);

    // Wait for router and component to be ready
    if (typeof window === 'undefined' || !router || !mounted) {
      return null;
    }

    useEffect(() => {
      let isMounted = true;

      const initAuth = async () => {
        try {
          if (!router.isReady) return;

          const {
            data: { user: currentUser },
            error,
          } = await supabase.auth.getUser();

          if (error) throw error;

          if (!currentUser) {
            router.push(`/auth/signin?redirectedFrom=${router.asPath}`);
            return;
          }

          setUser(currentUser);

          // Check for role
          if (requiredRoles) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', currentUser.id)
              .single();

            if (
              profileError ||
              (Array.isArray(requiredRoles)
                ? !requiredRoles.includes(profile?.user_type)
                : profile?.user_type !== requiredRoles)
            ) {
              router.push('/unauthorized');
              return;
            }
          }
        } catch (error) {
          console.error('Auth error:', error);
          if (isMounted) {
            router.push(`/auth/signin?redirectedFrom=${router.asPath}`);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };

      initAuth();

      return () => {
        isMounted = false;
      };
    }, [router.isReady, supabase, requiredRoles, router]);

    if (typeof window === 'undefined' || !mounted || isLoading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
