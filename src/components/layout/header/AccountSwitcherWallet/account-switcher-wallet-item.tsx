import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { formatMoney, getCurrencyDisplayCode } from '@/components/shared';
import { AppLinkedWithWalletIcon } from '@/components/shared_ui/app-linked-with-wallet-icon';
import Text from '@/components/shared_ui/text';
import { api_base } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import useStoreWalletAccountsList from '@/hooks/useStoreWalletAccountsList';
import { Analytics } from '@deriv-com/analytics';
import { Localize } from '@deriv-com/translations';
import WalletBadge from '../wallets/wallet-badge';
import './account-switcher-wallet-item.scss';

type TAccountSwitcherWalletItemProps = {
    account: Exclude<ReturnType<typeof useStoreWalletAccountsList>['data'], undefined>[number];
    closeAccountsDialog: () => void;
    show_badge?: boolean;
};

export const AccountSwitcherWalletItem = observer(
    ({ closeAccountsDialog, account, show_badge = false }: TAccountSwitcherWalletItemProps) => {
        const {
            currency,
            dtrade_loginid,
            dtrade_balance,
            gradients,
            icons,
            is_virtual,
            landing_company_name,
            icon_type,
        } = account;

        const {
            ui: { is_dark_mode_on },
            client,
        } = useStore();
        
        const { loginid: active_loginid, is_eu } = client;

        const theme = is_dark_mode_on ? 'dark' : 'light';
        const app_icon = is_dark_mode_on ? 'IcWalletOptionsDark' : 'IcWalletOptionsLight';
        const is_dtrade_active = dtrade_loginid === active_loginid;

        const switchAccount = async (loginId: number) => {
            const account_list = JSON.parse(localStorage.getItem('accountsList') ?? '{}');
            const token = account_list[loginId];

            // If token is missing, store the currency in session storage and return
            if (!token) {
                console.error(`No token found for account ${loginId}`);
                // Store the currency in session storage
                if (currency) {
                    sessionStorage.setItem('query_param_currency', currency);
                }

                // Set clientHasCurrency to false
                if (typeof (window as any).setClientHasCurrency === 'function') {
                    (window as any).setClientHasCurrency(false);
                }
                return;
            }

            const loginIdStr = loginId.toString();

            try {
                localStorage.setItem('authToken', token);
                localStorage.setItem('active_loginid', loginIdStr);
                const account_type =
                    loginId
                        .toString()
                        .match(/[a-zA-Z]+/g)
                        ?.join('') || '';
                Analytics.setAttributes({
                    account_type,
                });
                await api_base?.init(true);
                
                // Wait for authorization to complete with timeout
                const waitForAuthorization = (): Promise<boolean> => {
                    return new Promise((resolve) => {
                        const maxAttempts = 20; // 2 seconds total
                        let attempts = 0;
                        
                        const checkAuth = () => {
                            attempts++;
                            
                            // Check if authorization is complete
                            if (api_base?.is_authorized && api_base?.api && api_base.api.connection?.readyState === 1) {
                                resolve(true);
                                return;
                            }
                            
                            // If max attempts reached, resolve anyway
                            if (attempts >= maxAttempts) {
                                console.warn(`Authorization not completed for account ${loginIdStr} after ${maxAttempts} attempts`);
                                resolve(false);
                                return;
                            }
                            
                            // Retry after 100ms
                            setTimeout(checkAuth, 100);
                        };
                        
                        // Start checking immediately
                        setTimeout(checkAuth, 100);
                    });
                };
                
                const isAuthorized = await waitForAuthorization();
                
                if (!isAuthorized) {
                    console.error(`Failed to authorize account ${loginIdStr}`);
                    closeAccountsDialog();
                    // Don't clear tokens - let the user retry
                    return;
                }
                
                // Wait for balance to be loaded with reduced timeout
                const waitForBalance = (): Promise<void> => {
                    return new Promise((resolve) => {
                        const maxAttempts = 15; // 1.5 seconds total (reduced from 3 seconds)
                        let attempts = 0;
                        
                        const checkBalance = () => {
                            attempts++;
                            
                            // Explicitly request balance if API is ready and we haven't received it yet
                            if (attempts === 3 && api_base?.api && api_base?.is_authorized) {
                                try {
                                    // Request balance for all accounts to ensure we get the latest data
                                    api_base.api.send({
                                        balance: 1,
                                        account: 'all',
                                        subscribe: 1,
                                    });
                                } catch (error) {
                                    console.warn('Error requesting balance:', error);
                                }
                            }
                            
                            // Access client store directly to get current reactive value
                            const balanceData = client?.all_accounts_balance?.accounts?.[loginIdStr];
                            
                            // Check if balance exists and is valid
                            if (balanceData && balanceData.balance !== undefined && balanceData.balance !== null) {
                                resolve();
                                return;
                            }
                            
                            // If max attempts reached, resolve anyway (balance might not be available yet)
                            if (attempts >= maxAttempts) {
                                console.warn(`Balance not loaded for account ${loginIdStr} after ${maxAttempts} attempts, proceeding anyway`);
                                resolve();
                                return;
                            }
                            
                            // Retry after 100ms
                            setTimeout(checkBalance, 100);
                        };
                        
                        // Start checking after a small delay to allow subscription to be established
                        setTimeout(checkBalance, 150);
                    });
                };
                
                // Wait for balance to be loaded (with reduced timeout)
                await waitForBalance();
                
                // Force balance request for the specific account to ensure we get the latest balance
                if (api_base?.api && api_base?.is_authorized) {
                    try {
                        api_base.api.send({
                            balance: 1,
                            account: loginIdStr,
                            subscribe: 1,
                        });
                    } catch (error) {
                        console.warn('Error requesting balance for account:', error);
                    }
                }
                
                // Trigger a page update by forcing a re-render of account-dependent components
                // This ensures the UI updates with the new account data
                if (client) {
                    client.setLoginId(loginIdStr);
                }
                
                closeAccountsDialog();

                const client_accounts = JSON.parse(localStorage.getItem('clientAccounts') ?? '{}');
                const search_params = new URLSearchParams(window.location.search);
                const selected_account = Object.values(client_accounts)?.find(
                    (acc: any) => acc.loginid === loginIdStr
                );
                if (!selected_account) {
                    console.error(`Account ${loginIdStr} not found in client accounts`);
                    return;
                }
                const account_param = is_virtual ? 'demo' : selected_account.currency;
                search_params.set('account', account_param);
                window.history.pushState({}, '', `${window.location.pathname}?${search_params.toString()}`);
                
                // Force balance update for the new account
                setTimeout(() => {
                    const balanceData = client?.all_accounts_balance?.accounts?.[loginIdStr];
                    if (balanceData) {
                        client?.setBalance(balanceData.balance.toFixed(getDecimalPlaces(balanceData.currency)));
                        client?.setCurrency(balanceData.currency);
                    }
                }, 300);
            } catch (error) {
                console.error('Error switching account:', error);
                closeAccountsDialog();
                // Don't clear tokens on error - let the user retry
            }
        };

        return (
            <div
                className={classNames('acc-switcher-wallet-item__container', {
                    'acc-switcher-wallet-item__container--active': is_dtrade_active,
                })}
                data-testid='account-switcher-wallet-item'
                onClick={() => switchAccount(dtrade_loginid)}
                role='button'
            >
                <div>
                    <AppLinkedWithWalletIcon
                        app_icon={app_icon}
                        gradient_class={gradients?.card[theme] ?? ''}
                        type={icon_type}
                        wallet_icon={icons?.[theme] ?? ''}
                        hide_watermark
                    />
                </div>
                <div className='acc-switcher-wallet-item__content'>
                    <Text size='xxxs'>
                        {is_eu ? (
                            <Localize i18n_default_text='Multipliers' />
                        ) : (
                            <Localize i18n_default_text='Options' />
                        )}
                    </Text>
                    <Text size='xxxs'>
                        {is_virtual ? (
                            <Localize i18n_default_text='Demo Wallet' />
                        ) : (
                            <Localize
                                i18n_default_text='{{currency}} Wallet'
                                values={{ currency: getCurrencyDisplayCode(currency) }}
                            />
                        )}
                    </Text>
                    <Text size='xs' weight='bold'>
                        <span
                            className='acc-switcher-wallet-item__balance'
                        >
                            {`${formatMoney(currency ?? '', dtrade_balance || 0, true)} ${getCurrencyDisplayCode(
                                currency
                            )}`}
                        </span>
                    </Text>

                </div>
                {show_badge && <WalletBadge is_demo={Boolean(is_virtual)} label={landing_company_name} />}
            </div>
        );
    }
);