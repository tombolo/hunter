import React from 'react';

const AiPage: React.FC = () => {
    return (
        <div style={{ width: '100%', height: '100vh', marginTop: '4rem' }}>
            <iframe
                src="https://nuntool.vercel.app/"
                title="NunTool"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                }}
                loading="lazy"
                allow="clipboard-read; clipboard-write"
            />
        </div>
    );
};

export default AiPage;
