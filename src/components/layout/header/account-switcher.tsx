import React, { useEffect } from 'react';
import { lazy, Suspense, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { CurrencyIcon } from '@/components/currency/currency-icon';
import { addComma, getDecimalPlaces } from '@/components/shared';
import Popover from '@/components/shared_ui/popover';
import { api_base } from '@/external/bot-skeleton';
import { useOauth2 } from '@/hooks/auth/useOauth2';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { waitForDomElement } from '@/utils/dom-observer';
import { Analytics } from '@deriv-com/analytics';
import { localize } from '@deriv-com/translations';
import { AccountSwitcher as UIAccountSwitcher, Loader, useDevice } from '@deriv-com/ui';
import DemoAccounts from './common/demo-accounts';
import RealAccounts from './common/real-accounts';
import { TAccountSwitcher, TAccountSwitcherProps, TModifiedAccount } from './common/types';
import { LOW_RISK_COUNTRIES } from './utils';
import './account-switcher.scss';

const AccountInfoWallets = lazy(() => import('./wallets/account-info-wallets'));

const tabs_labels = {
    demo: localize('Demo'),
    real: localize('Real'),
};

const RenderAccountItems = ({
    isVirtual,
    modifiedCRAccountList,
    modifiedMFAccountList,
    modifiedVRTCRAccountList,
    switchAccount,
    activeLoginId,
    client,
}: TAccountSwitcherProps) => {
    const { oAuthLogout } = useOauth2({ handleLogout: async () => client.logout(), client });
    const is_low_risk_country = LOW_RISK_COUNTRIES().includes(client.account_settings?.country_code ?? '');
    const is_virtual = !!isVirtual;
    const residence = client.residence;

    useEffect(() => {
        // Update the max-height from the accordion content set from deriv-com/ui
        const parent_container = document.getElementsByClassName('account-switcher-panel')?.[0] as HTMLDivElement;
        if (!isVirtual && parent_container) {
            parent_container.style.maxHeight = '70vh';
            waitForDomElement('.deriv-accordion__content', parent_container)?.then((accordionElement: unknown) => {
                const element = accordionElement as HTMLDivElement;
                if (element) {
                    element.style.maxHeight = '70vh';
                }
            });
        }
    }, [isVirtual]);

    if (is_virtual) {
        return (
            <>
                <DemoAccounts
                    modifiedVRTCRAccountList={modifiedVRTCRAccountList as TModifiedAccount[]}
                    switchAccount={switchAccount}
                    activeLoginId={activeLoginId}
                    isVirtual={is_virtual}
                    tabs_labels={tabs_labels}
                    oAuthLogout={oAuthLogout}
                    is_logging_out={client.is_logging_out}
                />
            </>
        );
    } else {
        return (
            <RealAccounts
                modifiedCRAccountList={modifiedCRAccountList as TModifiedAccount[]}
                modifiedMFAccountList={modifiedMFAccountList as TModifiedAccount[]}
                switchAccount={switchAccount}
                isVirtual={is_virtual}
                tabs_labels={tabs_labels}
                is_low_risk_country={is_low_risk_country}
                oAuthLogout={oAuthLogout}
                loginid={activeLoginId}
                is_logging_out={client.is_logging_out}
                upgradeable_landing_companies={client?.landing_companies?.all_company ?? null}
                residence={residence}
            />
        );
    }
};

const AccountSwitcher = observer(({ activeAccount }: TAccountSwitcher) => {
    const { isDesktop } = useDevice();
    const { accountList } = useApiBase();
    const { ui, run_panel, client } = useStore();
    const { accounts } = client;
    const { toggleAccountsDialog, is_accounts_switcher_on, account_switcher_disabled_message } = ui;
    const { is_stop_button_visible } = run_panel;
    const has_wallet = Object.keys(accounts).some(id => accounts[id].account_category === 'wallet');

    const modifiedAccountList = useMemo(() => {
        return accountList?.map(account => {
            const balance = addComma(
                client.all_accounts_balance?.accounts?.[account?.loginid]?.balance?.toFixed(
                    getDecimalPlaces(account.currency)
                ) ?? '0'
            );
            
            return {
                ...account,
                balance,
                currencyLabel: account?.is_virtual
                    ? tabs_labels.demo
                    : (client.website_status?.currencies_config?.[account?.currency]?.name ?? account?.currency),
                icon: (
                    <CurrencyIcon
                        currency={account?.currency?.toLowerCase()}
                        loginid={account?.loginid}
                        isVirtual={Boolean(account?.is_virtual)}
                    />
                ),
                isVirtual: Boolean(account?.is_virtual),
                isActive: account?.loginid === activeAccount?.loginid,
            };
        });
    }, [
        accountList,
        client.all_accounts_balance?.accounts,
        client.website_status?.currencies_config,
        activeAccount?.loginid,
    ]);
    const modifiedCRAccountList = useMemo(() => {
        return modifiedAccountList?.filter(account => account?.loginid?.includes('CR')) ?? [];
    }, [modifiedAccountList]);

    const modifiedMFAccountList = useMemo(() => {
        return modifiedAccountList?.filter(account => account?.loginid?.includes('MF')) ?? [];
    }, [modifiedAccountList]);

    const modifiedVRTCRAccountList = useMemo(() => {
        return modifiedAccountList?.filter(account => account?.loginid?.includes('VRT')) ?? [];
    }, [modifiedAccountList]);

    const switchAccount = async (loginId: number) => {
        if (loginId.toString() === activeAccount?.loginid) return;
        
        const account_list = JSON.parse(localStorage.getItem('accountsList') ?? '{}');
        const token = account_list[loginId];
        if (!token) {
            console.error(`No token found for account ${loginId}`);
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
            
            // Initialize API and wait for authorization
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
                        
                        const balanceData = client.all_accounts_balance?.accounts?.[loginIdStr];
                        
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
            
            const search_params = new URLSearchParams(window.location.search);
            const selected_account = modifiedAccountList.find(acc => acc.loginid === loginIdStr);
            if (!selected_account) {
                console.error(`Account ${loginIdStr} not found in modified account list`);
                return;
            }
            const account_param = selected_account.is_virtual ? 'demo' : selected_account.currency;
            search_params.set('account', account_param);
            sessionStorage.setItem('query_param_currency', account_param);
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
            // Don't clear tokens on error - let the user retry
        }
    };

    return (
        activeAccount &&
        (has_wallet ? (
            <Suspense fallback={<Loader />}>
                <AccountInfoWallets is_dialog_on={is_accounts_switcher_on} toggleDialog={toggleAccountsDialog} />
            </Suspense>
        ) : (
            <Popover
                className='run-panel__info'
                classNameBubble='run-panel__info--bubble'
                alignment='bottom'
                message={account_switcher_disabled_message}
                zIndex='5'
            >
                <UIAccountSwitcher
                    activeAccount={activeAccount}
                    isDisabled={is_stop_button_visible}
                    tabsLabels={tabs_labels}
                    modalContentStyle={{
                        content: {
                            top: isDesktop ? '30%' : '50%',
                            borderRadius: '10px',
                        },
                    }}
                >
                    <UIAccountSwitcher.Tab title={tabs_labels.real}>
                        <RenderAccountItems
                            modifiedCRAccountList={modifiedCRAccountList as TModifiedAccount[]}
                            modifiedMFAccountList={modifiedMFAccountList as TModifiedAccount[]}
                            switchAccount={switchAccount}
                            activeLoginId={activeAccount?.loginid}
                            client={client}
                        />
                    </UIAccountSwitcher.Tab>
                    <UIAccountSwitcher.Tab title={tabs_labels.demo}>
                        <RenderAccountItems
                            modifiedVRTCRAccountList={modifiedVRTCRAccountList as TModifiedAccount[]}
                            switchAccount={switchAccount}
                            isVirtual
                            activeLoginId={activeAccount?.loginid}
                            client={client}
                        />
                    </UIAccountSwitcher.Tab>
                </UIAccountSwitcher>
            </Popover>
        ))
    );
});

export default AccountSwitcher;