import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/app/AppContext';
import { useCards } from '@/features/finance/api/useFinanceQueries';
import { useProfile } from '@/features/settings/api/useProfileQueries';

export const useOnboarding = () => {
  const { currentUser } = useApp();
  const { data: profile } = useProfile();
  const { data: cards = [] } = useCards();
  const [isCompleted, setIsCompleted] = useState(false);

  const storageKey = `vena-onboarding-completed:${currentUser?.id ?? 'guest'}`;

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    setIsCompleted(saved === '1');
  }, [storageKey]);

  const completeOnboarding = () => {
    window.localStorage.setItem(storageKey, '1');
    setIsCompleted(true);
  };

  const resetOnboarding = () => {
    window.localStorage.removeItem(storageKey);
    setIsCompleted(false);
  };

  return useMemo(() => ({
    isCompleted,
    profile,
    cards,
    completeOnboarding,
    resetOnboarding,
  }), [isCompleted, profile, cards]);
};
