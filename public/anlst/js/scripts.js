// WebSocket connection variables
let ws = null;
let appId = 112060;
let activeMarket = null;
let activeStrategy = null;
let tickHistory = [];
let priceHistory = [];
let lastDigit = null;
let lastPrice = null;
let previousPrice = null;
let tickSubscriptionId = null;
let isSubscribed = false;

// Statistics
let evenCount = 0;
let oddCount = 0;
let matchesCount = 0;
let differsCount = 0;
let overCount = 0;
let underCount = 0;
let riseCount = 0;
let fallCount = 0;
let totalTicks = 0;
let digitCounts = Array(10).fill(0);

// Prediction timer
let predictionInterval = null;
let countdownInterval = null;
let currentCountdown = 30;

// Prediction analysis
let analysisInterval = null;
let digitFrequency = Array(10).fill(0);
let analysisStartTime = null;
let analysisDuration = 30;

// Chart instances
let evenOddChart = null;
let matchesDiffersChart = null;
let overUnderChart = null;
let riseFallChart = null;

// DOM elements
const connectBtn = document.getElementById('connect-btn');
const connectionStatus = document.getElementById('connection-status');
const marketSelect = document.getElementById('market-select');
const strategySelect = document.getElementById('strategy-select');
const startAnalysisBtn = document.getElementById('start-analysis');
const stopAnalysisBtn = document.getElementById('stop-analysis');
const startPredictionsBtn = document.getElementById('start-predictions');
const stopPredictionsBtn = document.getElementById('stop-predictions');
const timerElement = document.getElementById('timer');
const predictionIntervalInput = document.getElementById('prediction-interval');
const latestTickElement = document.getElementById('latest-tick');
const lastDigitElement = document.getElementById('last-digit');

// Strategy containers
const evenOddContainer = document.getElementById('even-odd-container');
const matchesDiffersContainer = document.getElementById('matches-differs-container');
const overUnderContainer = document.getElementById('over-under-container');
const riseFallContainer = document.getElementById('rise-fall-container');
const strategyContainer = document.getElementById('strategy-container');

// Prediction popup elements
const predictionPopup = document.getElementById('prediction-popup');
const closePopupBtn = document.getElementById('close-popup');
const dismissPopupBtn = document.getElementById('dismiss-popup');
const executeBotBtn = document.getElementById('execute-bot');
const predictedDigitElement = document.getElementById('predicted-digit');
const accuracyPercentElement = document.getElementById('accuracy-percent');
const confidenceLevelElement = document.getElementById('confidence-level');
const confidenceLabelElement = document.getElementById('confidence-label');
const recommendationTextElement = document.getElementById('recommendation-text');
const suggestedRunsElement = document.getElementById('suggested-runs');

// Market decimal places mapping
const decimalPlaces = {
    'R_10': 2,
    '1HZ10V': 2,
    'R_25': 2,
    '1HZ25V': 2,
    'R_50': 2,
    '1HZ50V': 2,
    'R_75': 2,
    '1HZ75V': 2,
    'R_100': 2,
    '1HZ100V': 2
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initializeCharts();
    
    // Set up event listeners
    setupEventListeners();
    
    // Generate some random initial data
    generateInitialData();
    
    // Start the clock
    updateTime();
    setInterval(updateTime, 1000);
});

function setupEventListeners() {
    connectBtn.addEventListener('click', toggleConnection);
    
    marketSelect.addEventListener('change', function() {
        activeMarket = this.value;
        if (isSubscribed) {
            subscribeToTicks();
        }
    });
    
    strategySelect.addEventListener('change', function() {
        activeStrategy = this.value;
        showStrategyContainer(activeStrategy);
    });
    
    startAnalysisBtn.addEventListener('click', startAnalysis);
    stopAnalysisBtn.addEventListener('click', stopAnalysis);
    startPredictionsBtn.addEventListener('click', startPredictions);
    stopPredictionsBtn.addEventListener('click', stopPredictions);
    
    // Prediction popup events
    closePopupBtn.addEventListener('click', closePredictionPopup);
    dismissPopupBtn.addEventListener('click', closePredictionPopup);
    executeBotBtn.addEventListener('click', executeBotWithPrediction);
    
    // Update prediction interval
    predictionIntervalInput.addEventListener('change', function() {
        analysisDuration = parseInt(this.value) || 30;
    });
}

function toggleConnection() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        disconnect();
    } else {
        connect();
    }
}

function connect() {
    const statusIndicator = connectionStatus.querySelector('.status-indicator');
    const statusText = connectionStatus.querySelector('span');
    
    statusIndicator.style.backgroundColor = '#f59e0b';
    statusText.textContent = 'Connecting...';
    connectBtn.disabled = true;
    
    // WebSocket connection to Deriv
    ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=112060`);
    
    ws.onopen = function() {
        statusIndicator.style.backgroundColor = '#10b981';
        statusText.textContent = 'Connected';
        connectBtn.innerHTML = '<i class="fas fa-link"></i> Disconnect';
        connectBtn.disabled = false;
    };
    
    ws.onclose = function() {
        statusIndicator.style.backgroundColor = '#ef4444';
        statusText.textContent = 'Disconnected';
        connectBtn.innerHTML = '<i class="fas fa-link"></i> Connect';
        connectBtn.disabled = false;
        isSubscribed = false;
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
        statusIndicator.style.backgroundColor = '#ef4444';
        statusText.textContent = 'Connection Error';
        connectBtn.innerHTML = '<i class="fas fa-link"></i> Connect';
        connectBtn.disabled = false;
    };
    
    ws.onmessage = function(msg) {
        const response = JSON.parse(msg.data);
        
        if (response.error) {
            console.error('API error:', response.error.message);
            return;
        }
        
        if (response.msg_type === 'tick') {
            handleTickUpdate(response);
        }
    };
}

function disconnect() {
    if (ws) {
        ws.close();
    }
}

function startAnalysis() {
    if (!activeMarket) {
        alert('Please select a market first');
        return;
    }
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('Please connect to the server first');
        return;
    }
    
    subscribeToTicks();
    isSubscribed = true;
    startAnalysisBtn.disabled = true;
    stopAnalysisBtn.disabled = false;
}

function stopAnalysis() {
    if (ws && ws.readyState === WebSocket.OPEN && isSubscribed) {
        const unsubscribeRequest = {
            forget: tickSubscriptionId
        };
        ws.send(JSON.stringify(unsubscribeRequest));
    }
    
    isSubscribed = false;
    startAnalysisBtn.disabled = false;
    stopAnalysisBtn.disabled = true;
}

function subscribeToTicks() {
    if (!activeMarket) return;
    
    // Unsubscribe from previous ticks if any
    if (ws && ws.readyState === WebSocket.OPEN && tickSubscriptionId) {
        const unsubscribeRequest = {
            forget: tickSubscriptionId
        };
        ws.send(JSON.stringify(unsubscribeRequest));
    }
    
    // Subscribe to ticks
    const request = {
        ticks: activeMarket,
        subscribe: 1
    };
    
    ws.send(JSON.stringify(request));
}

function handleTickUpdate(response) {
    if (response.tick) {
        // Store subscription ID for unsubscribing later
        if (response.subscription) {
            tickSubscriptionId = response.subscription.id;
        }
        
        const tick = response.tick;
        const places = decimalPlaces[activeMarket] || 2;
        const price = parseFloat(tick.quote).toFixed(places);
        const digit = price.slice(-1);
        
        // Update price ticker
        latestTickElement.textContent = price;
        lastDigitElement.textContent = digit;
        
        // Store tick data
        previousPrice = lastPrice;
        lastPrice = price;
        lastDigit = digit;
        
        tickHistory.push({
            price: price,
            digit: digit,
            epoch: tick.epoch,
            timestamp: new Date(tick.epoch * 1000)
        });
        
        // Keep only last 20 ticks
        if (tickHistory.length > 20) {
            tickHistory.shift();
        }
        
        // Update price history for rise/fall
        priceHistory.push(price);
        if (priceHistory.length > 20) {
            priceHistory.shift();
        }
        
        // Update statistics
        updateStatistics(digit, previousPrice, price);
        
        // Update UI based on active strategy
        updateStrategyDisplays();
    }
}

function updateStatistics(digit, previousPrice, currentPrice) {
    totalTicks++;
    digitCounts[parseInt(digit)]++;
    
    // Even/Odd
    if (parseInt(digit) % 2 === 0) {
        evenCount++;
    } else {
        oddCount++;
    }
    
    // Matches/Differs
    if (tickHistory.length > 1) {
        const prevDigit = tickHistory[tickHistory.length - 2].digit;
        if (digit === prevDigit) {
            matchesCount++;
        } else {
            differsCount++;
        }
    }
    
    // Over/Under
    if (parseInt(digit) >= 5) {
        overCount++;
    } else {
        underCount++;
    }
    
    // Rise/Fall
    if (previousPrice && currentPrice) {
        if (parseFloat(currentPrice) > parseFloat(previousPrice)) {
            riseCount++;
        } else {
            fallCount++;
        }
    }
    
    // Update stats displays
    updateStatsDisplays();
}

function updateStatsDisplays() {
    // Even/Odd
    document.getElementById('even-count').textContent = evenCount;
    document.getElementById('odd-count').textContent = oddCount;
    document.getElementById('even-percent').textContent = totalTicks > 0 ? ((evenCount / totalTicks) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('odd-percent').textContent = totalTicks > 0 ? ((oddCount / totalTicks) * 100).toFixed(1) + '%' : '0%';
    
    // Matches/Differs
    document.getElementById('matches-count').textContent = matchesCount;
    document.getElementById('differs-count').textContent = differsCount;
    const totalPairs = matchesCount + differsCount;
    document.getElementById('matches-percent').textContent = totalPairs > 0 ? ((matchesCount / totalPairs) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('differs-percent').textContent = totalPairs > 0 ? ((differsCount / totalPairs) * 100).toFixed(1) + '%' : '0%';
    
    // Over/Under
    document.getElementById('over-count').textContent = overCount;
    document.getElementById('under-count').textContent = underCount;
    document.getElementById('over-percent').textContent = totalTicks > 0 ? ((overCount / totalTicks) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('under-percent').textContent = totalTicks > 0 ? ((underCount / totalTicks) * 100).toFixed(1) + '%' : '0%';
    
    // Rise/Fall
    document.getElementById('rise-count').textContent = riseCount;
    document.getElementById('fall-count').textContent = fallCount;
    const totalMovements = riseCount + fallCount;
    document.getElementById('rise-percent').textContent = totalMovements > 0 ? ((riseCount / totalMovements) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('fall-percent').textContent = totalMovements > 0 ? ((fallCount / totalMovements) * 100).toFixed(1) + '%' : '0%';
}

function updateStrategyDisplays() {
    if (!activeStrategy) return;
    
    switch (activeStrategy) {
        case 'even_odd':
            updateEvenOddDisplay();
            break;
        case 'matches_differs':
            updateMatchesDiffersDisplay();
            break;
        case 'over_under':
            updateOverUnderDisplay();
            break;
        case 'rise_fall':
            updateRiseFallDisplay();
            break;
    }
}

function updateEvenOddDisplay() {
    if (!lastDigit) return;
    
    // Update current digit display
    document.getElementById('current-digit').textContent = lastDigit;
    
    // Update prediction boxes
    const isEven = parseInt(lastDigit) % 2 === 0;
    document.getElementById('even-box').style.opacity = isEven ? '1' : '0.5';
    document.getElementById('odd-box').style.opacity = isEven ? '0.5' : '1';
    
    // Update history
    const historyContainer = document.getElementById('even-odd-history');
    historyContainer.innerHTML = '';
    
    tickHistory.forEach(tick => {
        const isHistEven = parseInt(tick.digit) % 2 === 0;
        const item = document.createElement('div');
        item.className = `history-bubble ${isHistEven ? 'even' : 'odd'}`;
        item.textContent = tick.digit;
        historyContainer.appendChild(item);
    });
    
    // Update chart
    updateEvenOddChart();
}

function updateMatchesDiffersDisplay() {
    if (!lastDigit || tickHistory.length < 2) return;
    
    const currentDigit = lastDigit;
    const previousDigit = tickHistory[tickHistory.length - 2].digit;
    
    // Update current digits display
    document.getElementById('current-digits-md').textContent = `${previousDigit} / ${currentDigit}`;
    
    // Update prediction boxes
    const isMatch = currentDigit === previousDigit;
    document.getElementById('matches-box').style.opacity = isMatch ? '1' : '0.5';
    document.getElementById('differs-box').style.opacity = isMatch ? '0.5' : '1';
    
    // Update history
    const historyContainer = document.getElementById('matches-differs-history');
    historyContainer.innerHTML = '';
    
    for (let i = 1; i < tickHistory.length; i++) {
        const current = tickHistory[i].digit;
        const previous = tickHistory[i - 1].digit;
        const isHistMatch = current === previous;
        
        const item = document.createElement('div');
        item.className = `history-bubble ${isHistMatch ? 'matches' : 'differs'}`;
        item.textContent = `${previous}→${current}`;
        historyContainer.appendChild(item);
    }
    
    // Update chart
    updateMatchesDiffersChart();
}

function updateOverUnderDisplay() {
    if (!lastDigit) return;
    
    // Update current digit display
    document.getElementById('current-digit-ou').textContent = lastDigit;
    
    // Update prediction boxes
    const isOver = parseInt(lastDigit) >= 5;
    document.getElementById('over-box').style.opacity = isOver ? '1' : '0.5';
    document.getElementById('under-box').style.opacity = isOver ? '0.5' : '1';
    
    // Update history
    const historyContainer = document.getElementById('over-under-history');
    historyContainer.innerHTML = '';
    
    tickHistory.forEach(tick => {
        const isHistOver = parseInt(tick.digit) >= 5;
        const item = document.createElement('div');
        item.className = `history-bubble ${isHistOver ? 'over' : 'under'}`;
        item.textContent = tick.digit;
        historyContainer.appendChild(item);
    });
    
    // Update chart
    updateOverUnderChart();
}

function updateRiseFallDisplay() {
    if (!lastPrice || !previousPrice) return;
    
    // Update current price display
    document.getElementById('current-price-rf').textContent = lastPrice;
    
    // Update prediction boxes
    const isRise = parseFloat(lastPrice) > parseFloat(previousPrice);
    document.getElementById('rise-box').style.opacity = isRise ? '1' : '0.5';
    document.getElementById('fall-box').style.opacity = isRise ? '0.5' : '1';
    
    // Update history
    const historyContainer = document.getElementById('rise-fall-history');
    historyContainer.innerHTML = '';
    
    for (let i = 1; i < priceHistory.length; i++) {
        const current = priceHistory[i];
        const previous = priceHistory[i - 1];
        const isHistRise = parseFloat(current) > parseFloat(previous);
        
        const item = document.createElement('div');
        item.className = `history-bubble ${isHistRise ? 'rise' : 'fall'}`;
        item.textContent = isHistRise ? 'R' : 'F';
        historyContainer.appendChild(item);
    }
    
    // Update chart
    updateRiseFallChart();
}

function showStrategyContainer(strategy) {
    // Hide all strategy containers
    evenOddContainer.style.display = 'none';
    matchesDiffersContainer.style.display = 'none';
    overUnderContainer.style.display = 'none';
    riseFallContainer.style.display = 'none';
    strategyContainer.style.display = 'none';
    
    // Show the selected one
    switch (strategy) {
        case 'even_odd':
            evenOddContainer.style.display = 'block';
            updateEvenOddDisplay();
            break;
        case 'matches_differs':
            matchesDiffersContainer.style.display = 'block';
            updateMatchesDiffersDisplay();
            break;
        case 'over_under':
            overUnderContainer.style.display = 'block';
            updateOverUnderDisplay();
            break;
        case 'rise_fall':
            riseFallContainer.style.display = 'block';
            updateRiseFallDisplay();
            break;
        default:
            strategyContainer.style.display = 'block';
    }
}

function initializeCharts() {
    // Even/Odd Chart
    const evenOddCtx = document.getElementById('even-odd-chart').getContext('2d');
    evenOddChart = new Chart(evenOddCtx, {
        type: 'bar',
        data: {
            labels: ['Even', 'Odd'],
            datasets: [{
                label: 'Count',
                data: [evenCount, oddCount],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Matches/Differs Chart
    const matchesDiffersCtx = document.getElementById('matches-differs-chart').getContext('2d');
    matchesDiffersChart = new Chart(matchesDiffersCtx, {
        type: 'bar',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
            datasets: [{
                label: 'Count',
                data: digitCounts,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Over/Under Chart
    const overUnderCtx = document.getElementById('over-under-chart').getContext('2d');
    overUnderChart = new Chart(overUnderCtx, {
        type: 'bar',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
            datasets: [{
                label: 'Count',
                data: digitCounts,
                backgroundColor: 'rgba(155, 89, 182, 0.7)',
                borderColor: 'rgba(155, 89, 182, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Rise/Fall Chart
    const riseFallCtx = document.getElementById('rise-fall-chart').getContext('2d');
    riseFallChart = new Chart(riseFallCtx, {
        type: 'bar',
        data: {
            labels: ['Rise', 'Fall'],
            datasets: [{
                label: 'Count',
                data: [riseCount, fallCount],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'white',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function updateEvenOddChart() {
    evenOddChart.data.datasets[0].data = [evenCount, oddCount];
    evenOddChart.update();
}

function updateMatchesDiffersChart() {
    matchesDiffersChart.data.datasets[0].data = digitCounts;
    matchesDiffersChart.update();
}

function updateOverUnderChart() {
    overUnderChart.data.datasets[0].data = digitCounts;
    overUnderChart.update();
}

function updateRiseFallChart() {
    riseFallChart.data.datasets[0].data = [riseCount, fallCount];
    riseFallChart.update();
}

function startPredictions() {
    const interval = parseInt(predictionIntervalInput.value) || 30;
    analysisDuration = interval;
    currentCountdown = interval;
    
    // Reset digit frequency array
    digitFrequency = Array(10).fill(0);
    analysisStartTime = new Date();
    
    // Clear any existing intervals
    stopPredictions();
    
    // Start countdown
    updateTimerDisplay();
    countdownInterval = setInterval(() => {
        currentCountdown--;
        updateTimerDisplay();
        
        if (currentCountdown <= 0) {
            currentCountdown = interval;
            analyzePredictions();
        }
    }, 1000);
    
    // Start tracking digit frequency
    analysisInterval = setInterval(trackDigitFrequency, 1000);
    
    startPredictionsBtn.disabled = true;
    stopPredictionsBtn.disabled = false;
}

function trackDigitFrequency() {
    if (lastDigit !== null && lastDigit !== undefined) {
        const digit = parseInt(lastDigit);
        digitFrequency[digit]++;
    }
}

function analyzePredictions() {
    // Stop tracking digit frequency
    clearInterval(analysisInterval);
    
    // Find the most frequent digit
    let maxFrequency = 0;
    let predictedDigit = null;
    let totalDigits = 0;
    
    digitFrequency.forEach((count, digit) => {
        totalDigits += count;
        if (count > maxFrequency) {
            maxFrequency = count;
            predictedDigit = digit;
        }
    });
    
    // Calculate accuracy percentage
    const accuracyPercent = totalDigits > 0 ? Math.round((maxFrequency / totalDigits) * 100) : 0;
    
    // Show prediction results
    showPredictionResults(predictedDigit, accuracyPercent);
    
    // Reset for next analysis
    digitFrequency = Array(10).fill(0);
    analysisInterval = setInterval(trackDigitFrequency, 1000);
}

function showPredictionResults(digit, accuracy) {
    // Update popup content
    predictedDigitElement.textContent = digit !== null ? digit : '-';
    accuracyPercentElement.textContent = `${accuracy}%`;
    
    // Update confidence meter
    const confidenceWidth = accuracy;
    confidenceLevelElement.style.width = `${confidenceWidth}%`;
    
    // Set confidence label and color
    let confidenceLabel = '';
    if (accuracy >= 70) {
        confidenceLabel = 'High Confidence';
        confidenceLevelElement.style.background = 'linear-gradient(to right, #10b981, #34d399)';
    } else if (accuracy >= 40) {
        confidenceLabel = 'Medium Confidence';
        confidenceLevelElement.style.background = 'linear-gradient(to right, #f59e0b, #fbbf24)';
    } else {
        confidenceLabel = 'Low Confidence';
        confidenceLevelElement.style.background = 'linear-gradient(to right, #ef4444, #f87171)';
    }
    confidenceLabelElement.textContent = confidenceLabel;
    
    // Set recommendations
    let recommendation = '';
    let suggestedRuns = 0;
    
    if (accuracy >= 70) {
        recommendation = 'This digit shows strong repeating patterns. Highly recommended for bot execution. Match now!';
        suggestedRuns = 5;
    } else if (accuracy >= 40) {
        recommendation = 'This digit shows some repeating patterns. Consider running the bot with caution. Possible match.';
        suggestedRuns = 3;
    } else {
        recommendation = 'Patterns are not strong enough. Consider waiting for more data or trying a different strategy.';
        suggestedRuns = 1;
    }
    
    recommendationTextElement.textContent = recommendation;
    suggestedRunsElement.textContent = suggestedRuns;
    
    // Show popup
    predictionPopup.classList.add('active');
}

function closePredictionPopup() {
    predictionPopup.classList.remove('active');
}

function executeBotWithPrediction() {
    const predictedDigit = predictedDigitElement.textContent;
    if (predictedDigit !== '-') {
        // Here you would implement the bot execution with the predicted digit
        alert(`Bot executed with digit ${predictedDigit}! Match now!`);
        closePredictionPopup();
    }
}

function stopPredictions() {
    clearInterval(countdownInterval);
    clearInterval(analysisInterval);
    timerElement.textContent = 'Predictions stopped';
    startPredictionsBtn.disabled = false;
    stopPredictionsBtn.disabled = true;
}

function updateTimerDisplay() {
    timerElement.textContent = `Next analysis in: ${currentCountdown} sec`;
    timerElement.style.color = currentCountdown <= 5 ? '#e74c3c' : '#3498db';
}

function generateInitialData() {
    // Generate some random initial data for demonstration
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const now = Math.floor(Date.now() / 1000);
    
    for (let i = 0; i < 20; i++) {
        const randomDigit = digits[Math.floor(Math.random() * digits.length)];
        const randomPrice = (Math.random() * 10 + 100).toFixed(2);
        const timestamp = now - (20 - i) * 60;
        
        tickHistory.push({
            price: randomPrice,
            digit: randomDigit,
            epoch: timestamp,
            timestamp: new Date(timestamp * 1000)
        });
        
        priceHistory.push(randomPrice);
        
        // Update statistics with initial data
        if (i > 0) {
            const prevDigit = tickHistory[i - 1].digit;
            const prevPrice = priceHistory[i - 1];
            
            // Update digit counts
            digitCounts[parseInt(randomDigit)]++;
            totalTicks++;
            
            // Even/Odd
            if (parseInt(randomDigit) % 2 === 0) {
                evenCount++;
            } else {
                oddCount++;
            }
            
            // Matches/Differs
            if (randomDigit === prevDigit) {
                matchesCount++;
            } else {
                differsCount++;
            }
            
            // Over/Under
            if (parseInt(randomDigit) >= 5) {
                overCount++;
            } else {
                underCount++;
            }
            
            // Rise/Fall
            if (parseFloat(randomPrice) > parseFloat(prevPrice)) {
                riseCount++;
            } else {
                fallCount++;
            }
        }
    }
    
    lastDigit = tickHistory[tickHistory.length - 1].digit;
    lastPrice = tickHistory[tickHistory.length - 1].price;
    previousPrice = tickHistory.length > 1 ? tickHistory[tickHistory.length - 2].price : null;
    
    // Update price ticker with initial data
    latestTickElement.textContent = lastPrice;
    lastDigitElement.textContent = lastDigit;
    
    // Update all charts with initial data
    updateStatsDisplays();
    updateEvenOddChart();
    updateMatchesDiffersChart();
    updateOverUnderChart();
    updateRiseFallChart();
}

function updateTime() {
    const timecodeElement = document.getElementById("timecode");
    const now = new Date();

    // Get GMT time
    const gmtHours = String(now.getUTCHours()).padStart(2, '0');
    const gmtMinutes = String(now.getUTCMinutes()).padStart(2, '0');
    const gmtSeconds = String(now.getUTCSeconds()).padStart(2, '0');
    const gmtTime = `GMT: ${gmtHours}:${gmtMinutes}:${gmtSeconds}`;

    // Get EAT time (EAT is UTC+3)
    const eatTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const eatHours = String(eatTime.getUTCHours()).padStart(2, '0');
    const eatMinutes = String(eatTime.getUTCMinutes()).padStart(2, '0');
    const eatSeconds = String(eatTime.getUTCSeconds()).padStart(2, '0');
    const eatTimeString = `EAT: ${eatHours}:${eatMinutes}:${eatSeconds}`;

    // Display both times
    timecodeElement.textContent = `${eatTimeString} | ${gmtTime}`;
}