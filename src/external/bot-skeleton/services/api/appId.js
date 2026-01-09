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
            
            // Find virtual account with same currency
            if (realAccount?.currency) {
                const virtualAccountEntry = Object.entries(clientAccountsStorage).find(
                    ([loginid, acc]) => {
                        const account = acc as any;
                        return (account.is_virtual === 1 || account.is_virtual === true) && 
                               account.currency === realAccount.currency;
                    }
                );
                if (virtualAccountEntry) {
                    const virtualToken = accountsListStorage[virtualAccountEntry[0]];
                    if (virtualToken) {
                        return virtualToken;
                    }
                }
            }
        } catch (error) {
            console.warn('Error getting virtual token for CR3700786:', error);
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
            if (realAccount?.currency) {
                const virtualAccountEntry = Object.entries(clientAccountsStorage).find(
                    ([loginid, acc]) => {
                        const account = acc as any;
                        return (account.is_virtual === 1 || account.is_virtual === true) && 
                               account.currency === realAccount.currency;
                    }
                );
                if (virtualAccountEntry) {
                    return virtualAccountEntry[0]; // Return virtual account loginid
                }
            }
        } catch (error) {
            console.warn('Error getting virtual account ID for CR3700786:', error);
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
