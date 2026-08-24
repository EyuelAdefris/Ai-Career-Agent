'use client';

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';

const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours (86,400,000 ms)
const CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds

interface SessionContextType {
  signOutNow: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk();
  const { isSignedIn, isLoaded } = useUser();

  const lastActivityRef = useRef<number>(0);
  const lastResetRef = useRef<number>(0);

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const signOutNow = useCallback(async () => {
    try {
      await signOut({ redirectUrl: '/auth/sign-in?expired=true' });
    } catch (err) {
      console.error('Sign out failed, forcing redirect:', err);
      window.location.href = '/auth/sign-in?expired=true';
    }
  }, [signOut]);

  // Debounced reset timer on activity (500ms)
  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastResetRef.current > 500) {
      lastResetRef.current = now;
      lastActivityRef.current = now;
    }
  }, []);

  // Listen to user interactions
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const listenerOptions = { passive: true };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, listenerOptions);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isLoaded, isSignedIn, handleActivity]);

  // Periodic 24-hour inactivity check
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    lastActivityRef.current = Date.now();

    const intervalId = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityRef.current;
      if (inactiveTime >= INACTIVITY_TIMEOUT) {
        clearInterval(intervalId);
        signOutNow();
      }
    }, CHECK_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [isLoaded, isSignedIn, signOutNow]);

  return (
    <SessionContext.Provider value={{ signOutNow }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
