import React from 'react';
import classNames from 'classnames';
import Money from '../../money';

export type TContractCardItemProps = {
    className: string;
    header: string;
    is_crypto: boolean;
    is_loss: boolean;
    is_won: boolean;
};

const ContractCardItem = ({
    className,
    children,
    header,
    is_crypto,
    is_loss,
    is_won,
}: React.PropsWithChildren<Partial<TContractCardItemProps>>) => {
    return (
        <div className={classNames('dc-contract-card-item', className)}>
            <div className='dc-contract-card-item__header'>{header}</div>
            <div
                className={classNames('dc-contract-card-item__body', {
                    'dc-contract-card-item__body--crypto': is_crypto,
                    'dc-contract-card-item__body--loss': is_loss,
                    'dc-contract-card-item__body--profit': is_won,
                })}
            >
                {React.Children.map(children, child => {
                    if (React.isValidElement(child) && child.type === Money) {
                        return React.cloneElement(child, {
                            className: classNames(child.props.className, 'dc-contract-card__profit-loss-value')
                        });
                    }
                    return child;
                })}
            </div>
        </div>
    );
};

export default ContractCardItem;
