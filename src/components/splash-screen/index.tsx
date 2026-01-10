import React, { useEffect, useRef, useState } from 'react';
import './splash-screen.scss';

const SplashScreen: React.FC = () => {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Loading bar animation with smooth easing and realistic timing
    useEffect(() => {
        let startTime: number | null = null;
        const duration = 2800; // 2.8 seconds total
        let animationFrameId: number;
        let lastUpdate = 0;
        
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Custom easing function that slows down at the end
            let easedProgress;
            if (progress < 0.8) {
                // Faster at the beginning (80% of progress in 70% of time)
                easedProgress = (progress / 0.7) * 0.8;
            } else {
                // Slow down for the last 20%
                easedProgress = 0.8 + ((progress - 0.7) / 0.3) * 0.2;
            }
            
            // Only update state at most every 32ms (~30fps) for better performance
            if (timestamp - lastUpdate > 32 || progress >= 1) {
                setLoadingProgress(Math.min(easedProgress * 100, 100));
                lastUpdate = timestamp;
            }
            
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else if (progress >= 1 && loadingProgress < 100) {
                // Ensure we end at exactly 100%
                setLoadingProgress(100);
            }
        };
        
        animationFrameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // Background pattern animation
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            // Set display size (css pixels)
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            
            // Set actual size in memory (scaled for retina display)
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            
            // Scale the drawing context
            ctx.scale(dpr, dpr);
            
            // Redraw the pattern
            drawGeometricPattern();
        };

        const drawGeometricPattern = () => {
            // Clear the canvas with a semi-transparent overlay
            ctx.fillStyle = 'rgba(8, 18, 37, 0.6)'; // Darker overlay for better contrast
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw subtle animated particles
            const particleCount = 50;
            const time = Date.now() * 0.001;
            
            for (let i = 0; i < particleCount; i++) {
                const x = (Math.sin(time * 0.5 + i * 0.1) * 0.5 + 0.5) * canvas.width;
                const y = (Math.cos(time * 0.3 + i * 0.2) * 0.5 + 0.5) * canvas.height;
                const size = Math.sin(time + i) * 2 + 3;
                
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(59, 130, 246, ${0.1 + Math.sin(time + i) * 0.1})`;
                ctx.fill();
            }
            
            // Draw subtle glow effect
            const gradient = ctx.createRadialGradient(
                canvas.width / 2, 
                canvas.height / 2, 
                0, 
                canvas.width / 2, 
                canvas.height / 2, 
                Math.max(canvas.width, canvas.height) * 0.8
            );
            gradient.addColorStop(0, 'rgba(29, 78, 216, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        drawGeometricPattern();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawGeometricPattern();
        };

        // Initial setup
        resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    return (
        <div className='splash-screen'>
            <canvas ref={canvasRef} className='background-canvas' />
            
            {/* Loading Logo */}
            <div className='loading-logo' />

            <div className='professional-container'>
                {/* Background overlay for better text readability */}
                <div className='background-overlay' />
                
                {/* Partnership Banner */}
                <div className='partnership-banner'>
                    <span className='partnership-text'>In partnership with</span>
                    <span className='deriv-logo'>DERIV</span>
                </div>

                <div className='main-content'>
                    {/* Logo Section */}
                    <div className='logo-section'>
                        <div className='logo-main' />
                        <div className='tagline'>PROFESSIONAL TRADING PLATFORM</div>
                    </div>

                    {/* Status Section */}
                    <div className='status-section'>
                        <h2 className='loading-title'>Initializing Trading Environment</h2>
                        <p className='loading-subtitle'>Preparing institutional-grade trading systems</p>

                        {/* Progress Bar */}
                        <div className='progress-section'>
                            <div className='progress-info'>
                                <span className='progress-label'>System Initialization</span>
                                <span className='progress-value'>{Math.round(loadingProgress)}%</span>
                            </div>
                            <div className='progress-bar-container'>
                                <div className='progress-bar-fill' style={{ width: `${loadingProgress}%` }}>
                                    <div className='progress-bar-glow'></div>
                                </div>
                            </div>
                        </div>

                        <div className='status-indicator'>
                            <span className='status-dot'></span>
                            <span className='status-text'>System Status: Optimal</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className='footer-section'>
                        <div className='powered-by'>
                            <span className='powered-text'>Powered by</span>
                            <span className='deriv-badge'>DERIV</span>
                        </div>
                        <div className='copyright'>
                            © {new Date().getFullYear()} Flux Trader | Professional Trading Solutions
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;