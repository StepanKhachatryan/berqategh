import { useEffect, useState } from 'react';
import { isConfigured, supabase } from './supabase';

/**
 * An optional account, by Google sign-in.
 *
 * Posting never needs one. What it adds is reach: every device signed in to
 * the same account sees and manages the listings posted from any of them
 * (migration 0024 links each device's owner token to the account). Gmail
 * only: Supabase has no Mail.ru or Yandex sign-in to offer.
 */
export interface Account {
  email: string | null;
  /** False until the stored session (if any) has been read. */
  ready: boolean;
}

/** Tracks the session; links this device each time someone signs in. */
export function useAccount(onLinked?: () => void): Account {
  const [account, setAccount] = useState<Account>({ email: null, ready: !isConfigured });

  useEffect(() => {
    if (!isConfigured) return;
    const auth = supabase().auth;

    void auth.getSession().then(({ data }) => {
      setAccount({ email: data.session?.user.email ?? null, ready: true });
      if (data.session) void linkDevice().then(() => onLinked?.());
    });

    const { data } = auth.onAuthStateChange((event, session) => {
      setAccount({ email: session?.user.email ?? null, ready: true });
      if (event === 'SIGNED_IN') void linkDevice().then(() => onLinked?.());
    });
    return () => data.subscription.unsubscribe();
    // Subscribed once; onLinked is read when an event arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return account;
}

async function linkDevice(): Promise<void> {
  await supabase().rpc('link_device');
}

const NOT_ENABLED = 'Google-ով մուտքը դեռ միացված չէ։ Փորձե՛ք ավելի ուշ։';

/**
 * Whether Google sign-in is switched on for the project. Without this check a
 * disabled provider sends people to a bare JSON error page on supabase.co
 * instead of an explanation here. If the check itself fails, go ahead.
 */
async function googleEnabled(): Promise<boolean> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
    });
    if (!response.ok) return true;
    const settings = (await response.json()) as { external?: { google?: boolean } };
    return settings.external?.google !== false;
  } catch {
    return true;
  }
}

/** Leaves for Google and comes back to the same page, signed in. */
export async function signInWithGoogle(): Promise<void> {
  const [{ data, error }, enabled] = await Promise.all([
    supabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/`, skipBrowserRedirect: true },
    }),
    googleEnabled(),
  ]);
  if (!enabled || (error && /provider is not enabled|unsupported provider/i.test(error.message))) {
    throw new Error(NOT_ENABLED);
  }
  if (error || !data.url) throw new Error('Չհաջողվեց մուտք գործել։ Փորձե՛ք կրկին։');
  window.location.assign(data.url);
}

export async function signOut(): Promise<void> {
  await supabase().auth.signOut();
}
