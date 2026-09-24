import { useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppDispatch } from '@/store/hooks';
import { setUser, setProfile, setInitialized, signOut } from '@/store/slices/authSlice';

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        dispatch(setUser({ id: session.user.id, email: session.user.email ?? '' }));
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            dispatch(setProfile(data as never));
            dispatch(setInitialized(true));
          });
      } else {
        dispatch(setInitialized(true));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT' || !session) {
          dispatch(signOut());
          return;
        }
        if (session?.user) {
          dispatch(setUser({ id: session.user.id, email: session.user.email ?? '' }));
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          dispatch(setProfile(data as never));
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
}
