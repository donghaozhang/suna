'use client';

import { createMutationHook, createQueryHook } from '@/hooks/use-query';
import {
  createCheckoutSession,
  checkBillingStatus,
  getAvailableModels,
  CreateCheckoutSessionRequest,
  BillingStatusResponse,
  AvailableModelsResponse
} from '@/lib/api';
import { modelKeys } from './keys';

// Temporary: Disable billing API calls by returning mock data
const getMockAvailableModels = async (): Promise<AvailableModelsResponse> => {
  console.log('[BILLING] Using mock available models data - billing disabled');
  return {
    models: [
      {
        id: 'gpt-4o',
        display_name: 'GPT-4o',
        short_name: 'GPT-4o',
        requires_subscription: false,
      },
      {
        id: 'gpt-4o-mini',
        display_name: 'GPT-4o Mini',
        short_name: 'GPT-4o Mini',
        requires_subscription: false,
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        display_name: 'Claude 3.5 Sonnet',
        short_name: 'Claude 3.5 Sonnet',
        requires_subscription: false,
      },
    ],
    subscription_tier: 'free',
    total_models: 3,
  };
};

const getMockBillingStatus = async (): Promise<BillingStatusResponse> => {
  console.log('[BILLING] Using mock billing status data - billing disabled');
  return {
    can_run: true,
    message: 'Billing disabled - unlimited usage',
    subscription: {
      price_id: 'free',
      plan_name: 'free',
      minutes_limit: 999999,
    },
  };
};

export const useAvailableModels = createQueryHook(
  modelKeys.available,
  getMockAvailableModels, // Use mock instead of getAvailableModels
  {
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  }
);

export const useBillingStatus = createQueryHook(
  ['billing', 'status'],
  getMockBillingStatus, // Use mock instead of checkBillingStatus
  {
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  }
);

export const useCreateCheckoutSession = createMutationHook(
  (request: CreateCheckoutSessionRequest) => {
    console.log('[BILLING] Checkout session disabled - billing disabled');
    return Promise.resolve({
      status: 'no_change' as const,
      url: '#',
      message: 'Billing disabled',
    });
  },
  {
    onSuccess: (data) => {
      console.log('[BILLING] Checkout session would redirect to:', data.url);
      // Don't actually redirect when billing is disabled
    },
    errorContext: {
      operation: 'create checkout session',
      resource: 'billing'
    }
  }
); 