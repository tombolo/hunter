import React, { useEffect, useRef } from 'react';

const Analysis = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (iframeRef.current) {
                iframeRef.current.style.height = `${window.innerHeight}px`;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Set initial height

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div style={{ width: '100%', marginTop: '2.5rem' }}>
            <iframe
                ref={iframeRef}
                src="/sbs/analysis.html"
                style={{
                    width: '100%',
                    border: 'none',
                    display: 'block'
                }}
                title="Analysis Dashboard"
            />
        </div>
    );
};

export default Analysis;