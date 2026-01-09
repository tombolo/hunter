import React, { useEffect, useRef, useState } from 'react';
import './ai.scss';

const AiPage: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState('600px'); // Default height

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.iframeHeight) {
                setIframeHeight(`${event.data.iframeHeight}px`);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div 
            className="ai-page-container"
            style={{ 
                width: '100%',
                height: '87vh',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <iframe
                ref={iframeRef}
                src="/sbs/thebot.html"
                title="AI Signal"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    flex: 1,
                    minHeight: 0 // Allows the iframe to shrink below its content size
                }}
            />
        </div>
    );
};

export default AiPage;
