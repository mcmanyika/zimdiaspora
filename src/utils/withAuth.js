'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function withAuth(WrappedComponent) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const supabase = createClientComponentClient();

    useEffect(() => {
      let isMounted = true;
      let subscription;

      const checkAuth = async () => {
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }
          
          if (!session) {
            router.push('/auth/signin');
            return;
          }
          
          if (isMounted) {
            setIsAuthenticated(true);
            setError(null);
          }
        } catch (error) {
          console.error('Auth error:', error);
          if (isMounted) {
            setError(error.message);
          }
          router.push('/auth/signin');
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      checkAuth();

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!session) {
          router.push('/auth/signin');
        }
      });
      subscription = data?.subscription;

      return () => {
        isMounted = false;
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      };
    }, [router]);

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-500">Authentication error: {error}</p>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

export default withAuth;
