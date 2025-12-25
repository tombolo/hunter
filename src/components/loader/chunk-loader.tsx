import React from 'react';
import './chunk-loader.scss';

const ChunkLoader = ({ message }: { message: string }) => {
    return (
        <div className='bubble-loader'>
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
            {message && <div className='bubble-loader__message'>{message}</div>}
        </div>
    );
};

export default ChunkLoader;
