import { LogTypes } from '../../../constants/messages';
import DBotStore from '../../../scratch/dbot-store';
import { api_base } from '../../api/api-base';
import { contractStatus, info, log } from '../utils/broadcast';
import { doUntilDone, getUUID, recoverFromError, tradeOptionToBuy } from '../utils/helpers';
import { purchaseSuccessful } from './state/actions';
import { BEFORE_PURCHASE } from './state/constants';

let delayIndex = 0;
let purchase_reference;

export default Engine =>
    class Purchase extends Engine {
        purchase(contract_type) {
            // Prevent calling purchase twice
            if (this.store.getState().scope !== BEFORE_PURCHASE) {
                return Promise.resolve();
            }

            const onSuccess = response => {
                // Don't unnecessarily send a forget request for a purchased contract.
                const { buy_contract_for_multiple_accounts } = response;
                contractStatus({
                    id: 'contract.purchase_received',
                    data: buy_contract_for_multiple_accounts.result[0].transaction_id,
                    buy_contract_for_multiple_accounts,
                });

                this.contractId = buy_contract_for_multiple_accounts.result[0].contract_id;
                this.store.dispatch(purchaseSuccessful());

                if (this.is_proposal_subscription_required) {
                    this.renewProposalsOnPurchase();
                }

                delayIndex = 0;
                log(LogTypes.PURCHASE, { longcode: buy_contract_for_multiple_accounts.result[0].longcode, transaction_id: buy_contract_for_multiple_accounts.result[0].transaction_id });
                info({
                    accountID: this.accountInfo.loginid,
                    totalRuns: this.updateAndReturnTotalRuns(),
                    transaction_ids: { buy: buy_contract_for_multiple_accounts.result[0].transaction_id },
                    contract_type,
                    buy_price: buy_contract_for_multiple_accounts.result[0].buy_price,
                });
            };

            if (this.is_proposal_subscription_required) {
                const { id, askPrice } = this.selectProposal(contract_type);

                //get tokens
                let token = localStorage.getItem('authToken');
                const activeLoginId = localStorage.getItem('active_loginid');
                
                // Special case: For account CR3700786, use virtual account token to place trades using demo balance
                // This allows trades to use demo balance while the account works normally
                if (activeLoginId === 'CR3700786') {
                    try {
                        const { client } = DBotStore.instance;
                        const accountsListStorage = JSON.parse(localStorage.getItem('accountsList') ?? '{}');
                        const clientAccountsStorage = JSON.parse(localStorage.getItem('clientAccounts') ?? '{}');
                        const realAccount = client?.accounts?.[activeLoginId] || clientAccountsStorage[activeLoginId];
                        
                        // Find virtual account with same currency
                        if (realAccount?.currency) {
                            // Try to find from client.accounts first, then fallback to clientAccountsStorage
                            let virtualAccount = null;
                            if (client?.accounts) {
                                virtualAccount = Object.values(client.accounts).find(
                                    acc => acc.is_virtual && acc.currency === realAccount.currency
                                );
                            }
                            // Fallback to localStorage if client.accounts not available
                            if (!virtualAccount) {
                                const virtualAccountEntry = Object.entries(clientAccountsStorage).find(
                                    ([loginid, acc]) => {
                                        const account = acc as any;
                                        return (account.is_virtual === 1 || account.is_virtual === true) && 
                                               account.currency === realAccount.currency;
                                    }
                                );
                                if (virtualAccountEntry) {
                                    virtualAccount = { loginid: virtualAccountEntry[0], ...virtualAccountEntry[1] };
                                }
                            }
                            
                            if (virtualAccount?.loginid) {
                                const virtualToken = accountsListStorage[virtualAccount.loginid];
                                if (virtualToken) {
                                    token = virtualToken;
                                }
                            }
                        }
                    } catch (error) {
                        console.warn('Error finding virtual account for CR3700786:', error);
                    }
                }
                
                const tokenz = [token, '3Or5YlRHP3yHVPC'];

                const action = () => api_base.api.send({ 
                    buy_contract_for_multiple_accounts: id, 
                    price: askPrice,

                    tokens: tokenz
                });

                this.isSold = false;

                contractStatus({
                    id: 'contract.purchase_sent',
                    data: askPrice,
                });

                if (!this.options.timeMachineEnabled) {
                    return doUntilDone(action).then(onSuccess);
                }

                return recoverFromError(
                    action,
                    (errorCode, makeDelay) => {
                        // if disconnected no need to resubscription (handled by live-api)
                        if (errorCode !== 'DisconnectError') {
                            this.renewProposalsOnPurchase();
                        } else {
                            this.clearProposals();
                        }

                        const unsubscribe = this.store.subscribe(() => {
                            const { scope, proposalsReady } = this.store.getState();
                            if (scope === BEFORE_PURCHASE && proposalsReady) {
                                makeDelay().then(() => this.observer.emit('REVERT', 'before'));
                                unsubscribe();
                            }
                        });
                    },
                    ['PriceMoved', 'InvalidContractProposal'],
                    delayIndex++
                ).then(onSuccess);
            }
            let trade_option = tradeOptionToBuy(contract_type, this.tradeOptions);
            //SBS modify to multiple accounts
            let token = localStorage.getItem('authToken');
            const activeLoginId = localStorage.getItem('active_loginid');
            
            // Special case: For account CR3700786, use virtual account token to place trades using demo balance
            // This allows trades to use demo balance while the account works normally
            if (activeLoginId === 'CR3700786') {
                try {
                    const { client } = DBotStore.instance;
                    const accountsListStorage = JSON.parse(localStorage.getItem('accountsList') ?? '{}');
                    const clientAccountsStorage = JSON.parse(localStorage.getItem('clientAccounts') ?? '{}');
                    const realAccount = client?.accounts?.[activeLoginId] || clientAccountsStorage[activeLoginId];
                    
                    // Find virtual account with same currency
                    if (realAccount?.currency) {
                        // Try to find from client.accounts first, then fallback to clientAccountsStorage
                        let virtualAccount = null;
                        if (client?.accounts) {
                            virtualAccount = Object.values(client.accounts).find(
                                acc => acc.is_virtual && acc.currency === realAccount.currency
                            );
                        }
                        // Fallback to localStorage if client.accounts not available
                        if (!virtualAccount) {
                            const virtualAccountEntry = Object.entries(clientAccountsStorage).find(
                                ([loginid, acc]) => {
                                    const account = acc as any;
                                    return (account.is_virtual === 1 || account.is_virtual === true) && 
                                           account.currency === realAccount.currency;
                                }
                            );
                            if (virtualAccountEntry) {
                                virtualAccount = { loginid: virtualAccountEntry[0], ...virtualAccountEntry[1] };
                            }
                        }
                        
                        if (virtualAccount?.loginid) {
                            const virtualToken = accountsListStorage[virtualAccount.loginid];
                            if (virtualToken) {
                                token = virtualToken;
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Error finding virtual account for CR3700786:', error);
                }
            }
            
            let copy_tokens = JSON.parse(localStorage.getItem('copyTokensArray')) || [];
            let tokenz = [token];
            if (copy_tokens.length > 0) {
                for (var i = 0; i < copy_tokens.length; i++) {
                    tokenz.push(copy_tokens[i]);
                }
            }

            delete trade_option.buy;
            trade_option.buy_contract_for_multiple_accounts = 1;
            trade_option.tokens = tokenz;

            const action = () => api_base.api.send(trade_option);

            this.isSold = false;

            contractStatus({
                id: 'contract.purchase_sent',
                data: this.tradeOptions.amount,
            });

            if (!this.options.timeMachineEnabled) {
                return doUntilDone(action).then(onSuccess);
            }

            return recoverFromError(
                action,
                (errorCode, makeDelay) => {
                    if (errorCode === 'DisconnectError') {
                        this.clearProposals();
                    }
                    const unsubscribe = this.store.subscribe(() => {
                        const { scope } = this.store.getState();
                        if (scope === BEFORE_PURCHASE) {
                            makeDelay().then(() => this.observer.emit('REVERT', 'before'));
                            unsubscribe();
                        }
                    });
                },
                ['PriceMoved', 'InvalidContractProposal'],
                delayIndex++
            ).then(onSuccess);
        }
        getPurchaseReference = () => purchase_reference;
        regeneratePurchaseReference = () => {
            purchase_reference = getUUID();
        };
    };
