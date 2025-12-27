"use client";
import React, { useEffect, useState } from "react";

const CopyTrading = () => {
    const [apiToken, setApiToken] = useState<string>("");
    const [isTokenVisible, setIsTokenVisible] = useState<boolean>(false);
    const [isSaved, setIsSaved] = useState<boolean>(false);

    // Load saved token on component mount
    useEffect(() => {
        const savedToken = localStorage.getItem('deriv_api_token');
        if (savedToken) {
            setApiToken(savedToken);
        }
    }, []);

    const handleSaveToken = () => {
        if (!apiToken.trim()) {
            alert('Please enter a valid API token');
            return;
        }
        
        // Save to localStorage
        localStorage.setItem('deriv_api_token', apiToken);
        setIsSaved(true);
        
        // Reset saved status after 2 seconds
        setTimeout(() => setIsSaved(false), 2000);
    };

    const toggleTokenVisibility = () => {
        setIsTokenVisible(!isTokenVisible);
    };

    return (
        <div style={{
            padding: "16px",
            width: "100%",
            minHeight: "100vh",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            background: "#0f172a",
            color: "#f8fafc"
        }}>
            <div style={{ 
                maxWidth: '500px',
                margin: '0 auto',
                paddingTop: '40px'
            }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <h1 style={{ 
                        fontSize: "24px", 
                        fontWeight: 700, 
                        margin: 0, 
                        marginBottom: "4px",
                        background: "linear-gradient(90deg, #bfbec4ff, #cbcacfff)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        display: "inline-block"
                    }}>
                        Copy Trading
                    </h1>
                    <p style={{ 
                        color: "#94a3b8", 
                        fontSize: "14px",
                        margin: "4px 0 0",
                    }}>
                        Configure your Deriv API token
                    </p>
                </div>

                <div style={{
                    background: "rgba(30, 41, 59, 0.5)",
                    padding: "24px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                }}>
                    <div style={{ 
                        fontSize: "16px", 
                        fontWeight: 600,
                        color: "#e2e8f0",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                        </svg>
                        API Token Configuration
                    </div>
                    
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{
                            display: "block",
                            fontSize: "14px",
                            color: "#94a3b8",
                            marginBottom: "8px"
                        }}>
                            Deriv API Token
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type={isTokenVisible ? "text" : "password"}
                                value={apiToken}
                                onChange={(e) => setApiToken(e.target.value)}
                                placeholder="Enter your Deriv API token..."
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    paddingRight: "44px",
                                    background: "rgba(15, 23, 42, 0.5)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    borderRadius: "6px",
                                    color: "#f8fafc",
                                    fontSize: "14px",
                                    outline: "none",
                                    transition: "all 0.2s",
                                    boxSizing: "border-box"
                                }}
                            />
                            <button
                                onClick={toggleTokenVisibility}
                                style={{
                                    position: "absolute",
                                    right: "8px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    padding: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "4px",
                                    transition: "all 0.2s"
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                                title={isTokenVisible ? "Hide token" : "Show token"}
                            >
                                {isTokenVisible ? (
                                    <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                    </svg>
                                ) : (
                                    <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p style={{
                            fontSize: "12px",
                            color: "#64748b",
                            marginTop: "8px",
                            lineHeight: 1.4
                        }}>
                            Your API token is stored locally in your browser and used to authenticate with Deriv's API.
                        </p>
                    </div>

                    <div style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "12px",
                        marginTop: "20px"
                    }}>
                        <button
                            onClick={handleSaveToken}
                            style={{
                                background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                                color: "white",
                                border: "none",
                                padding: "10px 24px",
                                borderRadius: "6px",
                                fontWeight: 600,
                                fontSize: "14px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                opacity: isSaved ? 0.7 : 1,
                                transform: isSaved ? "scale(0.98)" : "none"
                            }}
                            disabled={isSaved}
                        >
                            {isSaved ? (
                                <>
                                    <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                                    </svg>
                                    Save Token
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div style={{
                    marginTop: "40px",
                    paddingTop: "24px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                    textAlign: "center"
                }}>
                    <p style={{
                        fontSize: "13px",
                        color: "#64748b",
                        margin: 0
                    }}>
                        Need help finding your API token? Visit your <a 
                            href="https://app.deriv.com/account/api-token" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                                color: "#818cf8",
                                textDecoration: "none",
                                fontWeight: 500
                            }}
                        >
                            Deriv API Token
                        </a> page.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CopyTrading;