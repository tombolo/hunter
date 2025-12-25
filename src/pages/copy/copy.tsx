"use client";
import React, { useEffect, useRef, useState } from "react";

const WS_URL = "wss://ws.derivws.com/websockets/v3?app_id=70344";

interface WebSocketMessage {
    msg_type?: string;
    buy?: {
        contract_id: string;
    };
    error?: {
        message: string;
    };
    [key: string]: any;
}

const Contracts = () => {
    const ws = useRef<WebSocket | null>(null);
    const pingInterval = useRef<NodeJS.Timeout | null>(null);
    const [status, setStatus] = useState<string>("Disconnected");
    const [contractId, setContractId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [isBuying, setIsBuying] = useState<boolean>(false);
    const [isAutoTrading, setIsAutoTrading] = useState<boolean>(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [totalProfit, setTotalProfit] = useState<number>(0);
    const [tradeCount, setTradeCount] = useState<number>(0);
    const [apiToken, setApiToken] = useState<string>("");
    const [isTokenVisible, setIsTokenVisible] = useState<boolean>(false);
    
    // Refs for real-time state access
    const isBuyingRef = useRef<boolean>(false);
    const isAutoTradingRef = useRef<boolean>(false);
    const contractIdRef = useRef<string | null>(null);
    const isProcessingRef = useRef<boolean>(false);
    const isAuthorizedRef = useRef<boolean>(false);
    
    // Sync state with refs
    useEffect(() => {
        isBuyingRef.current = isBuying;
    }, [isBuying]);

    const log = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs((prev) => {
            const newLogs = [...prev, `${timestamp}: ${msg}`];
            // Keep only last 50 logs to prevent memory issues
            return newLogs.slice(-50);
        });
    };

    const subscribeToContract = (id: string) => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
        
        const subscribeRequest = {
            proposal_open_contract: 1,
            contract_id: id,
            subscribe: 1
        };
        
        console.log("Subscribing to contract:", id);
        ws.current.send(JSON.stringify(subscribeRequest));
    };

    const requestProposal = () => {
        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

        const proposalRequest = {
            proposal: 1,
            amount: 0.35,
            basis: "stake",
            contract_type: "DIGITOVER",
            currency: "USD",
            duration: 1,
            duration_unit: "t",
            barrier: "2",
            symbol: "1HZ10V",
        };

        console.log("Sending proposal request:", proposalRequest);
        ws.current.send(JSON.stringify(proposalRequest));
    };

    const buyContract = () => {
        if (!isAuthorizedRef.current || isBuyingRef.current) {
            return;
        }

        isBuyingRef.current = true;
        setIsBuying(true);
        requestProposal();
    };

    const stopAutoTrading = () => {
        if (!isAutoTradingRef.current) {
            return;
        }
        
        setIsAutoTrading(false);
        isAutoTradingRef.current = false;
        isProcessingRef.current = false;
        log("⏹️ Auto-trading STOPPED");
    };

    const toggleAutoTrading = () => {
        if (isAutoTradingRef.current) {
            stopAutoTrading();
        } else {
            if (!isAuthorizedRef.current) {
                log("✗ Please wait for authorization before starting auto-trading");
                return;
            }

            if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
                log("✗ Cannot start auto-trading: WebSocket not connected");
                return;
            }

            if (isAutoTradingRef.current) {
                log("⚠️ Auto-trading is already running");
                return;
            }

            setIsAutoTrading(true);
            isAutoTradingRef.current = true;
            log("🚀 Auto-trading STARTED");
            
            // Start the trading cycle if no contract is active
            if (!contractIdRef.current && !isBuying) {
                buyContract();
            }
        }
    };

    const resetStats = () => {
        setTotalProfit(0);
        setTradeCount(0);
        log("📊 Statistics reset");
    };

    const clearLogs = () => {
        setLogs([]);
    };

    const formatContractId = (id: string | null) => {
        if (!id) return "---";
        const idStr = String(id);
        if (idStr.length <= 12) return idStr;
        return `${idStr.substring(0, 12)}...`;
    };

    const connectWebSocket = () => {
        if (!apiToken.trim()) {
            log("✗ Please enter your API token");
            return;
        }

        // Close existing connection if any
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }

        // Clear existing ping interval
        if (pingInterval.current) {
            clearInterval(pingInterval.current);
            pingInterval.current = null;
        }

        // Reset states
        setIsAuthorized(false);
        isAuthorizedRef.current = false;
        stopAutoTrading();
        setContractId(null);
        contractIdRef.current = null;
        setIsBuying(false);
        isBuyingRef.current = false;

        log("Connecting to WebSocket...");
        setStatus("Connecting...");

        const socket = new WebSocket(WS_URL);
        ws.current = socket;

        const handleOpen = () => {
            setStatus("Connected");
            log("WebSocket connected");

            // Start ping interval
            pingInterval.current = setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ ping: 1 }));
                }
            }, 30000);

            socket.send(
                JSON.stringify({
                    authorize: apiToken,
                })
            );
        };

        const handleMessage = (event: MessageEvent) => {
            try {
                const data: WebSocketMessage = JSON.parse(event.data);

                if (data.msg_type === "authorize") {
                    setIsAuthorized(true);
                    isAuthorizedRef.current = true;
                    log("✓ Authorized successfully");
                } else if (data.msg_type === "buy" && data.buy) {
                    const id = String(data.buy.contract_id);
                    setContractId(id);
                    contractIdRef.current = id;
                    setIsBuying(false);
                    isProcessingRef.current = false;
                    log(`✓ Contract bought. ID: ${id}`);
                    
                    // Subscribe to contract updates
                    subscribeToContract(id);
                    
                } else if (data.msg_type === "proposal_open_contract") {
                    if (data.proposal_open_contract?.status === "sold") {
                        const profit = Number(data.proposal_open_contract.profit || 0);
                        
                        setTotalProfit(prev => prev + profit);
                        setTradeCount(prev => prev + 1);
                        log(`✓ Contract finished | Profit: ${profit.toFixed(2)}`);
                        
                        setContractId(null);
                        contractIdRef.current = null;
                        
                        // Update both state and ref
                        setIsBuying(false);
                        isBuyingRef.current = false;
                        isProcessingRef.current = false;
                    }
                    
                    // If auto-trading is on, buy again after 1 second
                    if (isAutoTradingRef.current) {
                        setTimeout(() => {
                            if (isAutoTradingRef.current && !isBuyingRef.current) {
                                buyContract();
                            }
                        }, 1000);
                    }
                } else if (data.msg_type === "proposal") {
                    if (data.error) {
                        log(`✗ Proposal failed: ${data.error.message}`);
                        setIsBuying(false);
                        return;
                    }

                    const proposalId = data.proposal.id;

                    const buyRequest = {
                        buy: proposalId,
                        price: 0.35,
                    };

                    console.log("Buying with proposal ID:", proposalId);
                    ws.current?.send(JSON.stringify(buyRequest));
                } else if (data.error) {
                    log(`✗ Error: ${data.error.message}`);
                    setIsBuying(false);
                    isProcessingRef.current = false;
                    
                    // If error during auto-trading, retry after delay
                    if (isAutoTradingRef.current) {
                        setTimeout(() => {
                            if (isAutoTradingRef.current && !contractIdRef.current && !isBuying) {
                                buyContract();
                            }
                        }, 1000);
                    }
                }
            } catch (error) {
                log(`✗ Error processing message: ${error}`);
                setIsBuying(false);
                isProcessingRef.current = false;
            }
        };

        const handleError = (error: Event) => {
            log(`✗ WebSocket error: ${error}`);
            setStatus("Error");
            setIsBuying(false);
            isProcessingRef.current = false;
        };

        const handleClose = () => {
            log("WebSocket disconnected");
            setStatus("Disconnected");
            setIsAuthorized(false);
            isAuthorizedRef.current = false;
            setIsBuying(false);
            isProcessingRef.current = false;
            stopAutoTrading();
        };

        socket.addEventListener('open', handleOpen);
        socket.addEventListener('message', handleMessage);
        socket.addEventListener('error', handleError);
        socket.addEventListener('close', handleClose);

        ws.current = socket;
    };

    const disconnectWebSocket = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.close();
        }
        setIsAuthorized(false);
        isAuthorizedRef.current = false;
        stopAutoTrading();
        setStatus("Disconnected");
        log("Disconnected manually");
    };

    useEffect(() => {
        // Update refs when state changes
        isAutoTradingRef.current = isAutoTrading;
        contractIdRef.current = contractId;
        isAuthorizedRef.current = isAuthorized;
    }, [isAutoTrading, contractId, isAuthorized]);

    return (
        <div
            style={{
                padding: "16px",
                width: "100%",
                minHeight: "100vh",
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                background: "#0f172a",
                color: "#f8fafc"
            }}
        >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
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
                    Automated Copy trading with Deriv API
                </p>
            </div>

            {/* API Token Input */}
            <div style={{
                background: "rgba(30, 41, 59, 0.5)",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
            }}>
                <div style={{ 
                    fontSize: "14px", 
                    fontWeight: 600,
                    color: "#e2e8f0",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}>
                    <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                    </svg>
                    API Token
                </div>
                
                <div style={{ position: "relative", marginBottom: "12px" }}>
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
                        onClick={() => setIsTokenVisible(!isTokenVisible)}
                        style={{
                            position: "absolute",
                            right: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "transparent",
                            border: "none",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "4px"
                        }}
                        type="button"
                    >
                        {isTokenVisible ? (
                            <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                            </svg>
                        ) : (
                            <svg style={{ width: "18px", height: "18px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        )}
                    </button>
                </div>

                <div style={{ 
                    fontSize: "11px", 
                    color: "#64748b",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "6px"
                }}>
                    <svg style={{ width: "14px", height: "14px", flexShrink: 0, marginTop: "1px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Get your API token from Deriv's developer portal
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={connectWebSocket}
                        disabled={!apiToken.trim() || status === "Connected"}
                        style={{
                            flex: 1,
                            padding: "12px",
                            background: !apiToken.trim() || status === "Connected" 
                                ? "#334155" 
                                : "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                            border: "none",
                            borderRadius: "6px",
                            cursor: !apiToken.trim() || status === "Connected" ? "not-allowed" : "pointer",
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "white",
                            transition: "all 0.2s",
                            opacity: !apiToken.trim() || status === "Connected" ? 0.7 : 1,
                            boxShadow: !apiToken.trim() || status === "Connected" 
                                ? "none" 
                                : "0 4px 12px -2px rgba(59, 130, 246, 0.4)"
                        }}
                    >
                        {status === "Connected" ? "✓ Connected" : "Connect"}
                    </button>
                    <button
                        onClick={disconnectWebSocket}
                        disabled={status !== "Connected"}
                        style={{
                            flex: 1,
                            padding: "12px",
                            background: status !== "Connected" ? "#334155" : "#ef4444",
                            border: "none",
                            borderRadius: "6px",
                            cursor: status !== "Connected" ? "not-allowed" : "pointer",
                            fontWeight: 600,
                            fontSize: "14px",
                            color: "white",
                            transition: "all 0.2s",
                            opacity: status !== "Connected" ? 0.7 : 1
                        }}
                    >
                        Disconnect
                    </button>
                </div>
            </div>

            {/* Status Bar */}
            <div style={{
                background: "rgba(30, 41, 59, 0.5)",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: status === "Connected" ? "#22c55e" : 
                                  status === "Connecting..." ? "#f59e0b" : "#ef4444",
                        boxShadow: status === "Connected" ? "0 0 10px rgba(34, 197, 94, 0.5)" : "none",
                        animation: status === "Connecting..." ? "pulse 1.5s infinite" : "none"
                    }}></div>
                    <span style={{ 
                        fontSize: "14px", 
                        fontWeight: 500,
                        color: "#e2e8f0"
                    }}>
                        {status}
                    </span>
                </div>
                <div style={{
                    background: isAuthorized ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    color: isAuthorized ? "#22c55e" : "#ef4444",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                }}>
                    {isAuthorized ? "✓ Authorized" : "Not Authorized"}
                </div>
            </div>

            {/* Trading Controls */}
            {isAuthorized && (
                <>
                    {/* Copy Trading Toggle Button */}
                    <div style={{ marginBottom: "20px" }}>
                        <button
                            onClick={toggleAutoTrading}
                            disabled={!isAuthorized}
                            style={{
                                width: "100%",
                                padding: "14px",
                                background: !isAuthorized 
                                    ? "#334155" 
                                    : isAutoTrading 
                                        ? "#ef4444" 
                                        : "linear-gradient(90deg, #3b82f6, #8b5cf6)",
                                border: "none",
                                borderRadius: "8px",
                                cursor: !isAuthorized ? "not-allowed" : "pointer",
                                fontWeight: 600,
                                fontSize: "16px",
                                color: "white",
                                transition: "all 0.2s",
                                opacity: !isAuthorized ? 0.7 : 1,
                                boxShadow: !isAuthorized || isAutoTrading 
                                    ? "none" 
                                    : "0 4px 14px -2px rgba(59, 130, 246, 0.4)"
                            }}
                        >
                            {!isAuthorized 
                                ? "🔒 Connect to Begin" 
                                : isAutoTrading 
                                    ? "🛑 Stop Copy Trading" 
                                    : "🚀 Start Copy Trading"}
                        </button>
                    </div>

                    {/* Current Contract Info */}
                    <div style={{
                        background: "rgba(30, 41, 59, 0.5)",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        border: "1px solid rgba(255, 255, 255, 0.05)",
                        transition: "all 0.3s",
                    }}>
                        <div style={{ 
                            fontSize: "12px", 
                            color: "#94a3b8",
                            marginBottom: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}>
                            <span style={{
                                display: "inline-block",
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: contractId ? "#22c55e" : "#94a3b8"
                            }}></span>
                            {contractId ? "Active Trade" : "No Active Trade"}
                        </div>
                        <div style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            fontFamily: "'Fira Code', 'Courier New', monospace",
                            wordBreak: "break-all",
                            color: contractId ? "#e2e8f0" : "#94a3b8",
                            background: "rgba(0, 0, 0, 0.2)",
                            padding: "10px",
                            borderRadius: "6px",
                            border: "1px solid rgba(255, 255, 255, 0.05)"
                        }}>
                            {contractId ? formatContractId(contractId) : "Waiting for trade..."}
                        </div>
                    </div>
                </>
            )}

            <style jsx global>{`
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                body {
                    margin: 0;
                    padding: 0;
                    background: #0f172a;
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                input:focus {
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
                }
                
                button:not(:disabled):hover {
                    transform: translateY(-1px);
                }
                
                @media (min-width: 640px) {
                    .container {
                        max-width: 640px;
                        margin: 0 auto;
                        padding: 24px;
                    }
                }
                
                @media (min-width: 768px) {
                    .container {
                        max-width: 768px;
                    }
                }
                
                @media (min-width: 1024px) {
                    .container {
                        max-width: 1024px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Contracts;