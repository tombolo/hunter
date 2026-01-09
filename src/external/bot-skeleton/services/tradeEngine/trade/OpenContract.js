import { getRoundedNumber } from '@/components/shared';
import { api_base } from '../../api/api-base';
import { contract as broadcastContract, contractStatus } from '../utils/broadcast';
import { openContractReceived, sell } from './state/actions';

export default Engine =>
    class OpenContract extends Engine {
        observeOpenContract() {
            if (!api_base.api) return;
            const subscription = api_base.api.onMessage().subscribe(({ data }) => {
                if (data.msg_type === 'proposal_open_contract') {
                    const contract = data.proposal_open_contract;
                    
                    // Log all contract updates for debugging CR3700786 issue
                    const activeLoginId = typeof localStorage !== 'undefined' ? localStorage.getItem('active_loginid') : null;
                    if (activeLoginId === 'CR3700786') {
                        console.log(`[CR3700786] Received proposal_open_contract:`, {
                            contract_id: contract?.contract_id,
                            status: contract?.status,
                            is_sold: contract?.is_sold,
                            expected_id: this.contractId,
                            matches: contract?.contract_id === this.contractId
                        });
                    }

                    if (!contract || !this.expectedContractId(contract?.contract_id)) {
                        // Log when contract is filtered out
                        if (activeLoginId === 'CR3700786' && contract) {
                            console.log(`[CR3700786] Contract filtered out - ID mismatch:`, {
                                received_id: contract.contract_id,
                                expected_id: this.contractId
                            });
                        }
                        return;
                    }

                    this.setContractFlags(contract);

                    this.data.contract = contract;

                    broadcastContract({ accountID: api_base.account_info.loginid, ...contract });

                    // Log contract updates for debugging CR3700786 issue
                    const activeLoginId = typeof localStorage !== 'undefined' ? localStorage.getItem('active_loginid') : null;
                    if (activeLoginId === 'CR3700786') {
                        console.log(`[CR3700786] Contract update received:`, {
                            contract_id: contract.contract_id,
                            status: contract.status,
                            is_sold: contract.is_sold,
                            is_expired: contract.is_expired,
                            expected_contract_id: this.contractId,
                            matches: contract.contract_id === this.contractId
                        });
                    }

                    if (this.isSold) {
                        // Clean up polling interval if it exists (for CR3700786)
                        if (this.contractPollInterval) {
                            clearInterval(this.contractPollInterval);
                            this.contractPollInterval = null;
                            console.log(`[CR3700786] Cleaned up contract polling interval`);
                        }
                        
                        this.contractId = '';
                        clearTimeout(this.transaction_recovery_timeout);
                        this.updateTotals(contract);
                        contractStatus({
                            id: 'contract.sold',
                            data: contract.transaction_ids.sell,
                            contract,
                        });

                        if (this.afterPromise) {
                            this.afterPromise();
                        }

                        this.store.dispatch(sell());
                    } else {
                        this.store.dispatch(openContractReceived());
                    }
                }
            });
            api_base.pushSubscription(subscription);
        }

        waitForAfter() {
            return new Promise(resolve => {
                this.afterPromise = resolve;
            });
        }

        setContractFlags(contract) {
            const { is_expired, is_valid_to_sell, is_sold, entry_tick } = contract;

            this.isSold = Boolean(is_sold);
            this.isSellAvailable = !this.isSold && Boolean(is_valid_to_sell);
            this.isExpired = Boolean(is_expired);
            this.hasEntryTick = Boolean(entry_tick);
        }

        expectedContractId(contractId) {
            return this.contractId && contractId === this.contractId;
        }

        getSellPrice() {
            const { bid_price: bidPrice, buy_price: buyPrice, currency } = this.data.contract;
            return getRoundedNumber(Number(bidPrice) - Number(buyPrice), currency);
        }
    };
