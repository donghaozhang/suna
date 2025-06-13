'use client';

import { createMutationHook, createQueryHook } from '@/hooks/use-query';
import {
  getSubscription,
  createPortalSession,
  SubscriptionStatus,
} from '@/lib/api';
import { subscriptionKeys } from './keys';

// Temporary: Disable billing API calls by returning mock data
const getMockSubscription = async (): Promise<SubscriptionStatus> => {
  console.log('[BILLING] Using mock subscription data - billing disabled');
  return {
    status: 'active',
    plan_name: 'free',
    price_id: 'free',
    current_period_end: null,
    cancel_at_period_end: false,
    trial_end: null,
    minutes_limit: 999999, // Unlimited for development
    current_usage: 0,
    has_schedule: false,
    scheduled_plan_name: null,
    scheduled_price_id: null,
    scheduled_change_date: null,
  };
};

export const useSubscription = createQueryHook(
  subscriptionKeys.details(),
  getMockSubscription, // Use mock instead of getSubscription
  {
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  },
);

export const useCreatePortalSession = createMutationHook(
  (params: { return_url: string }) => {
    console.log('[BILLING] Portal session disabled - billing disabled');
    return Promise.resolve({ url: '#' }); // Mock response
  },
  {
    onSuccess: (data) => {
      console.log('[BILLING] Portal session would redirect to:', data?.url);
      // Don't actually redirect when billing is disabled
    },
  },
);

export const isPlan = (
  subscriptionData: SubscriptionStatus | null | undefined,
  planId?: string,
): boolean => {
  if (!subscriptionData) return planId === 'free';
  return subscriptionData.plan_name === planId;
};
