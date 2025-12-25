import React from 'react';
import Text from '@/components/shared_ui/text';
import { Link } from '@deriv-com/quill-ui';
import { localize } from '@deriv-com/translations';
import {
    STRATEGY_TRADE_ASSOCIATIONS,
    TStrategyTradeAssociations,
} from './trade-constants';

/* -------------------- CONSTANTS -------------------- */

const TRADE_TYPE_LABELS = {
    ALL: 'All',
    OPTIONS: 'Options',
    ACCUMULATORS: 'Accumulators',
    MULTIPLIERS: 'Multipliers',
} as const;

const CHIP_INDEX_TO_TYPE = {
    0: 'ALL',
    1: 'ACCUMULATORS',
    2: 'OPTIONS',
    3: 'MULTIPLIERS',
} as const;

/* -------------------- TYPES -------------------- */

type TStrategyListProps = {
    selector_chip_value: number;
    search_value: string;
    is_searching: boolean;
    onSelectStrategy: (strategy: string, trade_type: string) => void;
};

type TStrategyBlock = {
    title: string;
    items: TStrategyTradeAssociations;
    onSelectStrategy: (strategy: string, trade_type: string) => void;
};

/* -------------------- HELPERS -------------------- */

const isAccumulator = (name: string) =>
    name.startsWith('ACCUMULATORS_');

const matchesSearch = (item: any, search: string) =>
    !search ||
    item.name.toLowerCase().includes(search) ||
    item.display_name?.toLowerCase().includes(search);

/* -------------------- COMPONENTS -------------------- */

const StrategyBlock = ({ title, items, onSelectStrategy }: TStrategyBlock) => {
    console.log(`[StrategyBlock] ${title}`, items);

    if (!items.length) return null;

    return (
        <div className='strategy-template-picker__strategy'>
            <div className='strategy-template-picker__title'>
                <Text size='xs' weight='bold'>
                    {title}
                </Text>
            </div>

            {items.map(item => (
                <div className='strategy-template-picker__links' key={item.id}>
                    <Link
                        hasChevron
                        size='sm'
                        onClick={() => onSelectStrategy(item.name, title)}
                    >
                        {item.display_name ?? item.name}
                    </Link>
                </div>
            ))}
        </div>
    );
};

const StrategyList = ({
    selector_chip_value,
    search_value,
    is_searching,
    onSelectStrategy,
}: TStrategyListProps) => {
    console.log('================ StrategyList RENDER ================');
    console.log('selector_chip_value:', selector_chip_value);
    console.log('search_value:', search_value);
    console.log('RAW DATA:', STRATEGY_TRADE_ASSOCIATIONS);

    const selected_type = CHIP_INDEX_TO_TYPE[selector_chip_value];
    console.log('Selected chip type:', selected_type);

    /* -------------------- SEARCH FILTER -------------------- */

    const searched = STRATEGY_TRADE_ASSOCIATIONS.filter(item => {
        const match = matchesSearch(item, search_value.toLowerCase());
        console.log('[SEARCH]', item.name, match);
        return match;
    });

    /* -------------------- GROUPING (FIXED) -------------------- */

    const accumulator = searched.filter(item =>
        isAccumulator(item.name)
    );

    const options = searched.filter(
        item => !isAccumulator(item.name)
    );

    const multiplier: TStrategyTradeAssociations = [];

    console.log('Grouped:', {
        accumulator,
        options,
        multiplier,
    });

    /* -------------------- CHIP FILTER -------------------- */

    const finalGroups = [
        {
            type: TRADE_TYPE_LABELS.ACCUMULATORS,
            items:
                selected_type === 'ALL' || selected_type === 'ACCUMULATORS'
                    ? accumulator
                    : [],
        },
        {
            type: TRADE_TYPE_LABELS.OPTIONS,
            items:
                selected_type === 'ALL' || selected_type === 'OPTIONS'
                    ? options
                    : [],
        },
        {
            type: TRADE_TYPE_LABELS.MULTIPLIERS,
            items:
                selected_type === 'ALL' || selected_type === 'MULTIPLIERS'
                    ? multiplier
                    : [],
        },
    ];

    console.log('Final groups:', finalGroups);

    const hasResults = finalGroups.some(g => g.items.length > 0);
    console.log('hasResults:', hasResults);

    /* -------------------- UI -------------------- */

    return hasResults ? (
        <div className='strategy-template-picker__strategies'>
            {finalGroups.map(group => (
                <StrategyBlock
                    key={group.type}
                    title={group.type}
                    items={group.items}
                    onSelectStrategy={onSelectStrategy}
                />
            ))}
        </div>
    ) : (
        <div className='no-results'>
            <Text size='xs'>
                {localize('No results found at the moment')}
            </Text>
        </div>
    );
};

export default StrategyList;
