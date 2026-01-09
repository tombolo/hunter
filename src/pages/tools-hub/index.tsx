import React from 'react';
import './tools-hub.scss';

const ToolsHubPage: React.FC = () => {
    return (
        <div className="tools-hub-container" style={{ width: '100%', height: '100vh' }}>
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

export default ToolsHubPage;
