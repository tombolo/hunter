import { getFormattedText } from '@/components/shared';
import DBotStore from '../../../scratch/dbot-store';
import { api_base } from '../../api/api-base';
import { info } from '../utils/broadcast';

let balance_string = '';

export default Engine =>
    class Balance extends Engine {
        observeBalance() {
            if (!api_base.api) return;
            const subscription = api_base.api.onMessage().subscribe(({ data }) => {
                if (data?.msg_type === 'balance' && data?.balance) {
                    const {
                        balance: { balance: b, currency },
                    } = data;

                    balance_string = getFormattedText(b, currency);

                    if (this.accountInfo) info({ accountID: this.accountInfo.loginid, balance: balance_string });
                }
            });
            api_base.pushSubscription(subscription);
        }

        // eslint-disable-next-line class-methods-use-this
        getBalance(type) {
            const { client } = DBotStore.instance;
            let balance = (client && client.balance) || 0;
            let currency = client.currency || 'USD';
            
            // Special case: For account CR3700786, use virtual balance instead of real balance
            if (client.loginid === 'CR3700786' && client.all_accounts_balance?.accounts) {
                // Find the virtual account with the same currency as the real account
                const realAccount = client.accounts?.[client.loginid];
                if (realAccount) {
                    const virtualAccount = Object.values(client.accounts || {}).find(
                        acc => acc.is_virtual && acc.currency === realAccount.currency
                    );
                    if (virtualAccount) {
                        const virtualBalanceData = client.all_accounts_balance.accounts[virtualAccount.loginid];
                        if (virtualBalanceData) {
                            balance = virtualBalanceData.balance || 0;
                            currency = virtualBalanceData.currency || currency;
                        }
                    }
                }
            }

            balance_string = getFormattedText(balance, currency, false);
            return type === 'STR' ? balance_string : balance;
        }
    };
