'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { isLocalMode } from '@/lib/config';
import {
    SubscriptionStatus,
} from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { X } from 'lucide-react';

// Mock functions to prevent 404 errors
const getMockSubscription = async (): Promise<SubscriptionStatus> => {
    console.log('[BILLING] Using mock subscription data - billing disabled');
    return {
        status: 'active',
        plan_name: 'free',
        price_id: 'free',
        current_period_end: null,
        cancel_at_period_end: false,
        trial_end: null,
        minutes_limit: 999999,
        current_usage: 0,
        has_schedule: false,
        scheduled_plan_name: null,
        scheduled_price_id: null,
        scheduled_change_date: null,
    };
};

const createMockPortalSession = async (params: { return_url: string }) => {
    console.log('[BILLING] Portal session disabled - billing disabled');
    return { url: '#' };
};

interface BillingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    returnUrl?: string;
}

export function BillingModal({ open, onOpenChange, returnUrl = window?.location?.href || '/' }: BillingModalProps) {
    const { session, isLoading: authLoading } = useAuth();
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isManaging, setIsManaging] = useState(false);

    useEffect(() => {
        async function fetchSubscription() {
            if (!open || authLoading || !session) return;

            try {
                setIsLoading(true);
                const data = await getMockSubscription(); // Use mock instead of real API
                setSubscriptionData(data);
                setError(null);
            } catch (err) {
                console.error('Failed to get subscription:', err);
                setError(err instanceof Error ? err.message : 'Failed to load subscription data');
            } finally {
                setIsLoading(false);
            }
        }

        fetchSubscription();
    }, [open, session, authLoading]);

    const handleManageSubscription = async () => {
        try {
            setIsManaging(true);
            const { url } = await createMockPortalSession({ return_url: returnUrl }); // Use mock instead of real API
            console.log('[BILLING] Would redirect to portal:', url);
            // Don't actually redirect when billing is disabled
        } catch (err) {
            console.error('Failed to create portal session:', err);
            setError(err instanceof Error ? err.message : 'Failed to create portal session');
        } finally {
            setIsManaging(false);
        }
    };

    // Local mode content
    if (isLocalMode()) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Billing & Subscription</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                            Running in local development mode - billing features are disabled
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            All premium features are available in this environment
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upgrade Your Plan</DialogTitle>
                </DialogHeader>

                {isLoading || authLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : error ? (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                        <p className="text-sm text-destructive">Error loading billing status: {error}</p>
                    </div>
                ) : (
                    <>
                        {subscriptionData && (
                            <div className="mb-6">
                                <div className="rounded-lg border bg-background p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-foreground/90">
                                            Agent Usage This Month
                                        </span>
                                        <span className="text-sm font-medium">
                                            {subscriptionData.current_usage?.toFixed(2) || '0'} /{' '}
                                            {subscriptionData.minutes_limit || '0'} minutes
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <PricingSection returnUrl={returnUrl} showTitleAndTabs={false} />

                        {subscriptionData && (
                            <Button
                                onClick={handleManageSubscription}
                                disabled={isManaging}
                                className="w-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all mt-4"
                            >
                                {isManaging ? 'Loading...' : 'Manage Subscription'}
                            </Button>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
} 