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
                
                // When using multiple accounts, find the contract from the virtual account for CR3700786
                const activeLoginId = localStorage.getItem('active_loginid');
                let contractResult = buy_contract_for_multiple_accounts.result[0];
                
                if (activeLoginId === 'CR3700786' && buy_contract_for_multiple_accounts.result.length > 1) {
                    // For CR3700786, the first token in the array should be the virtual account token
                    // So result[0] should be the virtual account contract
                    // But let's make sure by checking if we have multiple results
                    contractResult = buy_contract_for_multiple_accounts.result[0];
                }
                
                contractStatus({
                    id: 'contract.purchase_received',
                    data: contractResult.transaction_id,
                    buy_contract_for_multiple_accounts,
                });

                this.contractId = contractResult.contract_id;
                this.store.dispatch(purchaseSuccessful());

                // Explicitly request contract updates to ensure we receive settlement updates
                // This is especially important when using virtual account token for CR3700786
                if (this.contractId && api_base.api) {
                    console.log(`[CR3700786] Contract purchased: ${this.contractId}, setting up monitoring`);
                    
                    // Use setTimeout to ensure contract is fully created before subscribing
                    setTimeout(() => {
                        // Request the contract explicitly with subscribe to get all updates
                        try {
                            api_base.api.send({ 
                                proposal_open_contract: 1, 
                                contract_id: this.contractId,
                                subscribe: 1 
                            });
                            console.log(`[CR3700786] Subscribed to contract ${this.contractId} for updates`);
                            
                            // Set up periodic polling as a fallback to ensure we get contract updates
                            // This is important because the contract is on virtual account but we're monitoring from real account
                            if (activeLoginId === 'CR3700786' && !this.contractPollInterval) {
                                const contractIdToPoll = this.contractId;
                                this.contractPollInterval = setInterval(() => {
                                    if (contractIdToPoll && api_base.api) {
                                        try {
                                            // Poll the contract to get latest status
                                            api_base.api.send({ 
                                                proposal_open_contract: 1, 
                                                contract_id: contractIdToPoll 
                                            }).then((response) => {
                                                if (response?.proposal_open_contract) {
                                                    const contract = response.proposal_open_contract;
                                                    // Check if contract is sold or expired
                                                    if (contract.is_sold || contract.status !== 'open') {
                                                        if (this.contractPollInterval) {
                                                            clearInterval(this.contractPollInterval);
                                                            this.contractPollInterval = null;
                                                            console.log(`[CR3700786] Stopped polling - contract ${contract.status}`);
                                                        }
                                                    }
                                                }
                                            }).catch((error) => {
                                                console.warn(`[CR3700786] Error polling contract:`, error);
                                            });
                                        } catch (error) {
                                            console.warn(`[CR3700786] Error sending poll request:`, error);
                                        }
                                    } else if (!contractIdToPoll && this.contractPollInterval) {
                                        clearInterval(this.contractPollInterval);
                                        this.contractPollInterval = null;
                                        console.log(`[CR3700786] Stopped polling - no contract ID`);
                                    }
                                }, 2000); // Poll every 2 seconds
                                console.log(`[CR3700786] Started polling contract ${contractIdToPoll} every 2 seconds`);
                            }
                        } catch (error) {
                            console.warn(`[CR3700786] Error subscribing to contract ${this.contractId}:`, error);
                        }
                    }, 500);
                }

                if (this.is_proposal_subscription_required) {
                    this.renewProposalsOnPurchase();
                }

                delayIndex = 0;
                log(LogTypes.PURCHASE, { longcode: contractResult.longcode, transaction_id: contractResult.transaction_id });
                info({
                    accountID: this.accountInfo.loginid,
                    totalRuns: this.updateAndReturnTotalRuns(),
                    transaction_ids: { buy: contractResult.transaction_id },
                    contract_type,
                    buy_price: contractResult.buy_price,
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
