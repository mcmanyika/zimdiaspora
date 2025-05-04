'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const withAuth = (WrappedComponent, requiredRoles = null) => {
  return function WithAuthComponent(props) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClientComponentClient();

    useEffect(() => {
      const checkUser = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;
          
          if (!session) {
            router.push('/login');
            return;
          }
          
          setUser(session.user);

          // Check for role
          if (requiredRoles) {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', session.user.id)
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
          router.push('/login');
        } finally {
          setLoading(false);
        }
      };

      checkUser();
    }, [router, requiredRoles]);

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!user) {
      return null; // Router will handle redirect
    }

    return <WrappedComponent {...props} user={user} />;
  };
};

export default withAuth;
