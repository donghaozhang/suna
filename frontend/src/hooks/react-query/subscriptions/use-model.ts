import { createQueryHook } from "@/hooks/use-query";
import { AvailableModelsResponse, getAvailableModels } from "@/lib/api";
import { modelKeys } from "./keys";

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

export const useAvailableModels = createQueryHook<AvailableModelsResponse, Error>(
    modelKeys.available,
    getMockAvailableModels, // Use mock instead of getAvailableModels
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      select: (data) => {
        return {
          ...data,
          models: [...data.models].sort((a, b) => 
            a.display_name.localeCompare(b.display_name)
          ),
        };
      },
    }
  );