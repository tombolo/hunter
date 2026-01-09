import { useEffect, useState } from 'react';
import {
    account_list$,
    authData$,
    CONNECTION_STATUS,
    connectionStatus$,
    isAuthorized$,
    isAuthorizing$,
} from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { TAuthData } from '@/types/api-types';

export const useApiBase = () => {
    const [connectionStatus, setConnectionStatus] = useState<CONNECTION_STATUS>(CONNECTION_STATUS.UNKNOWN);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);
    const [accountList, setAccountList] = useState<TAuthData['account_list']>([]);
    const [authData, setAuthData] = useState<TAuthData | null>(null);
    const [activeLoginid, setActiveLoginid] = useState<string>('');

    useEffect(() => {
        const connectionStatusSubscription = connectionStatus$.subscribe(status => {
            setConnectionStatus(status as CONNECTION_STATUS);
        });

        const isAuthorizedSubscription = isAuthorized$.subscribe(isAuthorized => {
            setIsAuthorized(isAuthorized);
        });

        const isAuthorizingSubscription = isAuthorizing$.subscribe(isAuthorizing => {
            setIsAuthorizing(isAuthorizing);
        });
        const accountListSubscription = account_list$.subscribe(accountList => {
            setAccountList(accountList);
        });
        const authDataSubscription = authData$.subscribe(authData => {
            setAuthData(authData);
            // Always use active_loginid from localStorage, not from authData.loginid
            // This ensures account switching works correctly
            const storedLoginId = localStorage.getItem('active_loginid');
            if (storedLoginId) {
                setActiveLoginid(storedLoginId);
            } else {
                // Fallback to authData.loginid only if localStorage is empty
                setActiveLoginid(authData?.loginid ?? '');
            }
        });

        // Listen for storage changes to update activeLoginid when switching accounts
        const handleStorageChange = () => {
            const storedLoginId = localStorage.getItem('active_loginid');
            if (storedLoginId) {
                setActiveLoginid(storedLoginId);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        // Also check on mount
        handleStorageChange();

        return () => {
            connectionStatusSubscription.unsubscribe();
            isAuthorizedSubscription.unsubscribe();
            isAuthorizingSubscription.unsubscribe();
            accountListSubscription.unsubscribe();
            authDataSubscription.unsubscribe();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return { connectionStatus, isAuthorized, isAuthorizing, accountList, authData, activeLoginid };
};
