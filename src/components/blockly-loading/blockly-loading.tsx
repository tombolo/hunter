import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import React from 'react';
import './blockly-loading.scss';

const BlocklyLoading = observer(() => {
    const { blockly_store } = useStore();
    const { is_loading } = blockly_store;

    if (!is_loading) return null;

    return (
        <div className='bubble-loader' data-testid='blockly-loader'>
            <div className='bubble-loader__container'>
                {[0, 1, 2, 3, 4].map((index) => (
                    <div 
                        key={index} 
                        className='bubble-loader__bubble'
                        style={{ 
                            animationDelay: `${index * 0.15}s`,
                            backgroundColor: `hsl(${index * 70}, 70%, 65%)`
                        }}
                    />
                ))}
            </div>
            <div className='bubble-loader__message'>Loading Blockly...</div>
        </div>
    );
});

export default BlocklyLoading;
