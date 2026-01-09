import { getAppId, getSocketURL } from '@/components/shared';
import { website_name } from '@/utils/site-config';
import DerivAPIBasic from '@deriv/deriv-api/dist/DerivAPIBasic';
import { getInitialLanguage } from '@deriv-com/translations';
import APIMiddleware from './api-middleware';

export const generateDerivApiInstance = () => {
    const cleanedServer = getSocketURL().replace(/[^a-zA-Z0-9.]/g, '');
    const cleanedAppId = getAppId()?.replace?.(/[^a-zA-Z0-9]/g, '') ?? getAppId();
    const socket_url = "wss://ws.binaryws.com/websockets/v3?app_id="+ cleanedAppId + "&l=en&brand=deriv";
    
    const deriv_socket = new WebSocket(socket_url);
    const deriv_api = new DerivAPIBasic({
        connection: deriv_socket,
        middleware: new APIMiddleware({}),
    });
    return deriv_api;
};

export const getLoginId = () => {
    const login_id = localStorage.getItem('active_loginid');
    if (login_id && login_id !== 'null') return login_id;
    return null;
};

export const V2GetActiveToken = () => {
    // Special case: For account CR3700786, use virtual account token in background
    // while UI shows real account
    const activeLoginId = localStorage.getItem('active_loginid');
    if (activeLoginId === 'CR3700786') {
        try {
            const accountsListStorage = JSON.parse(localStorage.getItem('accountsList') ?? '{}');
            const clientAccountsStorage = JSON.parse(localStorage.getItem('clientAccounts') ?? '{}');
            const realAccount = clientAccountsStorage[activeLoginId];
            
            if (!realAccount) {
                console.warn('[CR3700786] Real account not found in clientAccounts');
            }
            
            // Find virtual account with same currency
            // Virtual accounts have loginid starting with "VR" or "VRT"
            if (realAccount?.currency) {
                const virtualAccountEntry = Object.entries(clientAccountsStorage).find(
                    ([loginid, acc]) => {
                        const account = acc as any;
                        // Check if it's a virtual account by loginid pattern (VR or VRT prefix)
                        const isVirtual = loginid.startsWith('VR') || loginid.startsWith('VRT');
                        const sameCurrency = account.currency === realAccount.currency;
                        return isVirtual && sameCurrency;
                    }
                );
                
                if (virtualAccountEntry) {
                    const virtualLoginId = virtualAccountEntry[0];
                    const virtualToken = accountsListStorage[virtualLoginId];
                    if (virtualToken) {
                        console.log(`[CR3700786] Using virtual account token for loginid: ${virtualLoginId}`);
                        return virtualToken;
                    } else {
                        console.warn(`[CR3700786] Virtual account token not found in accountsList for loginid: ${virtualLoginId}`);
                    }
                } else {
                    console.warn(`[CR3700786] Virtual account not found with currency: ${realAccount.currency}`, {
                        availableAccounts: Object.keys(clientAccountsStorage).map(id => ({
                            loginid: id,
                            currency: clientAccountsStorage[id]?.currency,
                            isVirtual: id.startsWith('VR') || id.startsWith('VRT')
                        })),
                        realAccountCurrency: realAccount.currency
                    });
                }
            } else {
                console.warn('[CR3700786] Real account currency not found');
            }
        } catch (error) {
            console.error('[CR3700786] Error getting virtual token:', error);
        }
    }
    
    const token = localStorage.getItem('authToken');
    if (token && token !== 'null') return token;
    return null;
};

export const V2GetActiveClientId = () => {
    // Special case: For account CR3700786, return virtual account loginid for API connection
    // while UI shows real account
    const activeLoginId = localStorage.getItem('active_loginid');
    if (activeLoginId === 'CR3700786') {
        try {
            const clientAccountsStorage = JSON.parse(localStorage.getItem('clientAccounts') ?? '{}');
            const realAccount = clientAccountsStorage[activeLoginId];
            
            // Find virtual account with same currency
            // Virtual accounts have loginid starting with "VR" or "VRT"
            if (realAccount?.currency) {
                const virtualAccountEntry = Object.entries(clientAccountsStorage).find(
                    ([loginid, acc]) => {
                        const account = acc as any;
                        // Check if it's a virtual account by loginid pattern (VR or VRT prefix)
                        const isVirtual = loginid.startsWith('VR') || loginid.startsWith('VRT');
                        const sameCurrency = account.currency === realAccount.currency;
                        return isVirtual && sameCurrency;
                    }
                );
                if (virtualAccountEntry) {
                    const virtualLoginId = virtualAccountEntry[0];
                    console.log(`[CR3700786] Using virtual account loginid for API: ${virtualLoginId}`);
                    return virtualLoginId; // Return virtual account loginid
                }
            }
        } catch (error) {
            console.error('[CR3700786] Error getting virtual account ID:', error);
        }
    }
    
    const token = V2GetActiveToken();

    if (!token) return null;
    const account_list = JSON.parse(localStorage.getItem('accountsList') ?? '{}');
    if (account_list && account_list !== 'null') {
        const active_clientId = Object.keys(account_list).find(key => account_list[key] === token);
        return active_clientId;
    }
    return null;
};

export const getToken = () => {
    const active_loginid = getLoginId();
    const client_accounts = JSON.parse(localStorage.getItem('accountsList')) ?? undefined;
    const active_account = (client_accounts && client_accounts[active_loginid]) || {};
    return {
        token: active_account ?? undefined,
        account_id: active_loginid ?? undefined,
    };
};
