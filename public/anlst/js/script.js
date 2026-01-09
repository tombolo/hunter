// WebSocket connection variables
let ws = null;
let appId = 114464;
let activeMarket = 'R_10'; // Default market
let activeStrategy = 'even_odd'; // Default strategy
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

// Chart instances
let evenOddChart = null;
let matchesDiffersChart = null;
let overUnderChart = null;
let riseFallChart = null;

// DOM elements
const connectionStatus = document.getElementById('connection-status');
const marketSelect = document.getElementById('market-select');
const strategySelect = document.getElementById('strategy-select');
const stopAnalysisBtn = document.getElementById('stop-analysis');
const startPredictionsBtn = document.getElementById('start-predictions');
const stopPredictionsBtn = document.getElementById('stop-predictions');
const timerElement = document.getElementById('timer');
const predictionIntervalInput = document.getElementById('prediction-interval');
const latestTickElement = document.getElementById('latest-tick');
const lastDigitElement = document.getElementById('last-digit');
const signalContent = document.getElementById('signal-content');

// Strategy containers
const evenOddContainer = document.getElementById('even-odd-container');
const matchesDiffersContainer = document.getElementById('matches-differs-container');
const overUnderContainer = document.getElementById('over-under-container');
const riseFallContainer = document.getElementById('rise-fall-container');
const strategyContainer = document.getElementById('strategy-container');

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
    
    // Automatically connect and start analysis
    connect();
});

function setupEventListeners() {
    marketSelect.addEventListener('change', function() {
        activeMarket = this.value;
        if (isSubscribed) {
            subscribeToTicks();
        }
        generateSignal();
    });
    
    strategySelect.addEventListener('change', function() {
        activeStrategy = this.value;
        showStrategyContainer(activeStrategy);
        generateSignal();
    });
    
    stopAnalysisBtn.addEventListener('click', stopAnalysis);
    startPredictionsBtn.addEventListener('click', startPredictions);
    stopPredictionsBtn.addEventListener('click', stopPredictions);
}

function connect() {
    connectionStatus.className = 'badge bg-warning me-3';
    connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Connecting...';
    
    // WebSocket connection to Deriv
    ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=114464');
    
    ws.onopen = function() {
        connectionStatus.className = 'badge bg-success me-3';
        connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Connected';
        startAnalysis();
    };
    
    ws.onclose = function() {
        connectionStatus.className = 'badge bg-danger me-3';
        connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
        isSubscribed = false;
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
        connectionStatus.className = 'badge bg-danger me-3';
        connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Connection Error';
    };
    
    ws.onmessage = function(msg) {
        const response = JSON.parse(msg.data);
        
        if (response.error) {
            console.error('API error:', response.error.message);
            return;
        }
        
        if (response.msg_type === 'tick') {
            handleTickUpdate(response);
            generateSignal();
        }
    };
}

function generateSignal() {
    if (!activeStrategy || tickHistory.length < 10) {
        signalContent.innerHTML = `
            <div class="signal-message">
                <i class="fas fa-info-circle me-2"></i>
                <span>Collecting more data for accurate signals...</span>
            </div>
        `;
        return;
    }

    let signalHTML = '';
    
    switch (activeStrategy) {
        case 'even_odd':
            const evenPercent = (evenCount / totalTicks) * 100;
            const oddPercent = (oddCount / totalTicks) * 100;
            
            if (evenPercent > 55) {
                signalHTML = `
                    <div class="signal-strong">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>STRONG SIGNAL: Trade EVEN (E)</strong>
                        <p>Even numbers appearing ${evenPercent.toFixed(1)}% of the time</p>
                        <p>Last digits: ${getLastDigits(5).join(', ')}</p>
                    </div>
                `;
            } else if (oddPercent > 55) {
                signalHTML = `
                    <div class="signal-strong">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>STRONG SIGNAL: Trade ODD (O)</strong>
                        <p>Odd numbers appearing ${oddPercent.toFixed(1)}% of the time</p>
                        <p>Last digits: ${getLastDigits(5).join(', ')}</p>
                    </div>
                `;
            } else {
                signalHTML = `
                    <div class="signal-weak">
                        <i class="fas fa-info-circle me-2"></i>
                        <span>No strong signal detected</span>
                        <p>Even: ${evenPercent.toFixed(1)}% | Odd: ${oddPercent.toFixed(1)}%</p>
                        <p>Last digits: ${getLastDigits(5).join(', ')}</p>
                    </div>
                `;
            }
            break;
            
        case 'matches_differs':
            const matchesPercent = (matchesCount / (matchesCount + differsCount)) * 100;
            const mostFrequentDigit = getMostFrequentDigit();
            
            if (matchesPercent > 60) {
                signalHTML = `
                    <div class="signal-strong">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>STRONG SIGNAL: Trade MATCH (M)</strong>
                        <p>Matches occurring ${matchesPercent.toFixed(1)}% of the time</p>
                        <p>Most frequent digit: ${mostFrequentDigit}</p>
                        <p>Last pairs: ${getLastPairs(3).join(', ')}</p>
                    </div>
                `;
            } else if (matchesPercent < 40) {
                signalHTML = `
                    <div class="signal-strong">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>STRONG SIGNAL: Trade DIFFER (D)</strong>
                        <p>Differs occurring ${(100 - matchesPercent).toFixed(1)}% of the time</p>
                        <p>Last pairs: ${getLastPairs(3).join(', ')}</p>
                    </div>
                `;
            } else {
                signalHTML = `
                    <div class="signal-weak">
                        <i class="fas fa-info-circle me-2"></i>
                        <span>No strong signal detected</span>
                        <p>Matches: ${matchesPercent.toFixed(1)}% | Differs: ${(100 - matchesPercent).toFixed(1)}%</p>
                        <p>Last pairs: ${getLastPairs(3).join(', ')}</p>
                    </div>
                `;
            }
            break;
            
        case 'over_under':
            const overPercent = (overCount / totalTicks) * 100;
            const underPercent = (underCount / totalTicks) * 100;
            
            // Check for digits 0-3 frequency
            const lowDigitsCount = digitCounts.slice(0, 4).reduce((a, b) => a + b, 0);
            const lowDigitsPercent = (lowDigitsCount / totalTicks) * 100;
            
            // Check for digits 7-9 frequency
            const highDigitsCount = digitCounts.slice(7).reduce((a, b) => a + b, 0);
            const highDigitsPercent = (highDigitsCount / totalTicks) * 100;
            
            if (overPercent > 60 && lowDigitsPercent < 30) {
                signalHTML = `
                    <div class="signal-strong">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>STRONG SIGNAL: Trade OVER (5-9)</strong>
                        <p>Over occurring ${overPercent.toFixed(1)}% of the time</p>
                        <p>Digits 0-3 appearing only ${lowDigitsPercent.toFixed(1)}%</p>
                        <p>Last digits: ${getLastDigits(5).join(', ')}</p>
                    </div>
                `;
            } else if (underPercent > 60 && highDigitsPercent < 30) {
                signalHTML = `
                    <div class="signal-strong">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>STRONG SIGNAL: Trade UNDER (0-4)</strong>
                        <p>Under occurring ${underPercent.toFixed(1)}% of the time</p>
                        <p>Digits 7-9 appearing only ${highDigitsPercent.toFixed(1)}%</p>
                        <p>Last digits: ${getLastDigits(5).join(', ')}</p>
                    </div>
                `;
            } else {
                signalHTML = `
                    <div class="signal-weak">
                        <i class="fas fa-info-circle me-2"></i>
                        <span>No strong signal detected</span>
                        <p>Over: ${overPercent.toFixed(1)}% | Under: ${underPercent.toFixed(1)}%</p>
                        <p>Last digits: ${getLastDigits(5).join(', ')}</p>
                    </div>
                `;
            }
            break;
            
        case 'rise_fall':
            const risePercent = (riseCount / (riseCount + fallCount)) * 100;
            const fallPercent = (fallCount / (riseCount + fallCount)) * 100;
            
            if (risePercent > 60) {
                signalHTML = `
                    <div class="signal-strong">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>STRONG SIGNAL: Trade RISE (R)</strong>
                        <p>Rise occurring ${risePercent.toFixed(1)}% of the time</p>
                        <p>Last movements: ${getLastMovements(3).join(', ')}</p>
                    </div>
                `;
            } else if (fallPercent > 60) {
                signalHTML = `
                    <div class="signal-strong">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>STRONG SIGNAL: Trade FALL (F)</strong>
                        <p>Fall occurring ${fallPercent.toFixed(1)}% of the time</p>
                        <p>Last movements: ${getLastMovements(3).join(', ')}</p>
                    </div>
                `;
            } else {
                signalHTML = `
                    <div class="signal-weak">
                        <i class="fas fa-info-circle me-2"></i>
                        <span>No strong signal detected</span>
                        <p>Rise: ${risePercent.toFixed(1)}% | Fall: ${fallPercent.toFixed(1)}%</p>
                        <p>Last movements: ${getLastMovements(3).join(', ')}</p>
                    </div>
                `;
            }
            break;
            
        default:
            signalHTML = `
                <div class="signal-message">
                    <i class="fas fa-info-circle me-2"></i>
                    <span>Select a strategy to get signals</span>
                </div>
            `;
    }
    
    signalContent.innerHTML = signalHTML;
}

function getMostFrequentDigit() {
    let maxCount = 0;
    let frequentDigit = 0;
    
    for (let i = 0; i < digitCounts.length; i++) {
        if (digitCounts[i] > maxCount) {
            maxCount = digitCounts[i];
            frequentDigit = i;
        }
    }
    
    return frequentDigit;
}

function getLastDigits(count) {
    const start = Math.max(0, tickHistory.length - count);
    return tickHistory.slice(start).map(t => t.digit);
}

function getLastPairs(count) {
    const pairs = [];
    const start = Math.max(1, tickHistory.length - count);
    
    for (let i = start; i < tickHistory.length; i++) {
        pairs.push(`${tickHistory[i-1].digit}→${tickHistory[i].digit}`);
    }
    
    return pairs;
}

function getLastMovements(count) {
    const movements = [];
    const start = Math.max(1, priceHistory.length - count);
    
    for (let i = start; i < priceHistory.length; i++) {
        movements.push(parseFloat(priceHistory[i]) > parseFloat(priceHistory[i-1]) ? 'R' : 'F');
    }
    
    return movements;
}

function disconnect() {
    if (ws) {
        ws.close();
    }
}

function startAnalysis() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        setTimeout(startAnalysis, 1000);
        return;
    }
    
    subscribeToTicks();
    isSubscribed = true;
    stopAnalysisBtn.disabled = false;
    showStrategyContainer(activeStrategy);
    generateSignal();
}

function stopAnalysis() {
    if (ws && ws.readyState === WebSocket.OPEN && isSubscribed) {
        const unsubscribeRequest = {
            forget: tickSubscriptionId
        };
        ws.send(JSON.stringify(unsubscribeRequest));
    }
    
    isSubscribed = false;
    stopAnalysisBtn.disabled = true;
    strategyContainer.style.display = 'block';
    evenOddContainer.style.display = 'none';
    matchesDiffersContainer.style.display = 'none';
    overUnderContainer.style.display = 'none';
    riseFallContainer.style.display = 'none';
}

function subscribeToTicks() {
    if (!activeMarket) return;
    
    if (ws && ws.readyState === WebSocket.OPEN && tickSubscriptionId) {
        const unsubscribeRequest = {
            forget: tickSubscriptionId
        };
        ws.send(JSON.stringify(unsubscribeRequest));
    }
    
    const request = {
        ticks: activeMarket,
        subscribe: 1
    };
    
    ws.send(JSON.stringify(request));
}

function handleTickUpdate(response) {
    if (response.tick) {
        if (response.subscription) {
            tickSubscriptionId = response.subscription.id;
        }
        
        const tick = response.tick;
        const places = decimalPlaces[activeMarket] || 2;
        const price = parseFloat(tick.quote).toFixed(places);
        const digit = price.slice(-1);
        
        latestTickElement.textContent = price;
        lastDigitElement.textContent = digit;
        
        previousPrice = lastPrice;
        lastPrice = price;
        lastDigit = digit;
        
        tickHistory.push({
            price: price,
            digit: digit,
            epoch: tick.epoch,
            timestamp: new Date(tick.epoch * 1000)
        });
        
        if (tickHistory.length > 20) {
            tickHistory.shift();
        }
        
        priceHistory.push(price);
        if (priceHistory.length > 20) {
            priceHistory.shift();
        }
        
        updateStatistics(digit, previousPrice, price);
        updateStrategyDisplays();
    }
}

function updateStatistics(digit, previousPrice, currentPrice) {
    totalTicks++;
    digitCounts[parseInt(digit)]++;
    
    if (parseInt(digit) % 2 === 0) {
        evenCount++;
    } else {
        oddCount++;
    }
    
    if (tickHistory.length > 1) {
        const prevDigit = tickHistory[tickHistory.length - 2].digit;
        if (digit === prevDigit) {
            matchesCount++;
        } else {
            differsCount++;
        }
    }
    
    if (parseInt(digit) >= 5) {
        overCount++;
    } else {
        underCount++;
    }
    
    if (previousPrice && currentPrice) {
        if (parseFloat(currentPrice) > parseFloat(previousPrice)) {
            riseCount++;
        } else {
            fallCount++;
        }
    }
    
    updateStatsDisplays();
}

function updateStatsDisplays() {
    document.getElementById('even-count').textContent = evenCount;
    document.getElementById('odd-count').textContent = oddCount;
    document.getElementById('even-percent').textContent = totalTicks > 0 ? ((evenCount / totalTicks) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('odd-percent').textContent = totalTicks > 0 ? ((oddCount / totalTicks) * 100).toFixed(1) + '%' : '0%';
    
    document.getElementById('matches-count').textContent = matchesCount;
    document.getElementById('differs-count').textContent = differsCount;
    const totalPairs = matchesCount + differsCount;
    document.getElementById('matches-percent').textContent = totalPairs > 0 ? ((matchesCount / totalPairs) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('differs-percent').textContent = totalPairs > 0 ? ((differsCount / totalPairs) * 100).toFixed(1) + '%' : '0%';
    
    document.getElementById('over-count').textContent = overCount;
    document.getElementById('under-count').textContent = underCount;
    document.getElementById('over-percent').textContent = totalTicks > 0 ? ((overCount / totalTicks) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('under-percent').textContent = totalTicks > 0 ? ((underCount / totalTicks) * 100).toFixed(1) + '%' : '0%';
    
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
    
    const displayValue = parseInt(lastDigit) % 2 === 0 ? 'E' : 'O';
    document.getElementById('current-digit').textContent = displayValue;
    
    const isEven = displayValue === 'E';
    document.getElementById('even-box').style.opacity = isEven ? '1' : '0.5';
    document.getElementById('odd-box').style.opacity = isEven ? '0.5' : '1';
    
    const historyContainer = document.getElementById('even-odd-history');
    historyContainer.innerHTML = '';
    
    tickHistory.forEach(tick => {
        const displayValue = parseInt(tick.digit) % 2 === 0 ? 'E' : 'O';
        const isHistEven = displayValue === 'E';
        const item = document.createElement('div');
        item.className = `history-item ${isHistEven ? 'even' : 'odd'}`;
        item.textContent = displayValue;
        historyContainer.appendChild(item);
    });
    
    updateEvenOddChart();
}

function updateMatchesDiffersDisplay() {
    if (!lastDigit || tickHistory.length < 2) return;
    
    const currentDigit = lastDigit;
    const previousDigit = tickHistory[tickHistory.length - 2].digit;
    
    document.getElementById('current-digits-md').textContent = `${previousDigit} / ${currentDigit}`;
    
    const isMatch = currentDigit === previousDigit;
    document.getElementById('matches-box').style.opacity = isMatch ? '1' : '0.5';
    document.getElementById('differs-box').style.opacity = isMatch ? '0.5' : '1';
    
    const historyContainer = document.getElementById('matches-differs-history');
    historyContainer.innerHTML = '';
    
    for (let i = 1; i < tickHistory.length; i++) {
        const current = tickHistory[i].digit;
        const previous = tickHistory[i - 1].digit;
        const isHistMatch = current === previous;
        
        const item = document.createElement('div');
        item.className = `history-item ${isHistMatch ? 'matches' : 'differs'}`;
        item.textContent = `${previous}→${current}`;
        historyContainer.appendChild(item);
    }
    
    updateMatchesDiffersChart();
}

function updateOverUnderDisplay() {
    if (!lastDigit) return;
    
    document.getElementById('current-digit-ou').textContent = lastDigit;
    
    const isOver = parseInt(lastDigit) >= 5;
    document.getElementById('over-box').style.opacity = isOver ? '1' : '0.5';
    document.getElementById('under-box').style.opacity = isOver ? '0.5' : '1';
    
    const historyContainer = document.getElementById('over-under-history');
    historyContainer.innerHTML = '';
    
    tickHistory.forEach(tick => {
        const isHistOver = parseInt(tick.digit) >= 5;
        const item = document.createElement('div');
        item.className = `history-item ${isHistOver ? 'over' : 'under'}`;
        item.textContent = tick.digit;
        historyContainer.appendChild(item);
    });
    
    updateOverUnderChart();
}

function updateRiseFallDisplay() {
    if (!lastPrice || !previousPrice) return;
    
    document.getElementById('current-price-rf').textContent = lastPrice;
    
    const isRise = parseFloat(lastPrice) > parseFloat(previousPrice);
    document.getElementById('rise-box').style.opacity = isRise ? '1' : '0.5';
    document.getElementById('fall-box').style.opacity = isRise ? '0.5' : '1';
    
    const historyContainer = document.getElementById('rise-fall-history');
    historyContainer.innerHTML = '';
    
    for (let i = 1; i < priceHistory.length; i++) {
        const current = priceHistory[i];
        const previous = priceHistory[i - 1];
        const isHistRise = parseFloat(current) > parseFloat(previous);
        
        const item = document.createElement('div');
        item.className = `history-item ${isHistRise ? 'rise' : 'fall'}`;
        item.textContent = isHistRise ? 'R' : 'F';
        historyContainer.appendChild(item);
    }
    
    updateRiseFallChart();
}

function showStrategyContainer(strategy) {
    evenOddContainer.style.display = 'none';
    matchesDiffersContainer.style.display = 'none';
    overUnderContainer.style.display = 'none';
    riseFallContainer.style.display = 'none';
    strategyContainer.style.display = 'none';
    
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
    const evenOddCtx = document.getElementById('even-odd-chart').getContext('2d');
    evenOddChart = new Chart(evenOddCtx, {
        type: 'bar',
        data: {
            labels: ['Even', 'Odd'],
            datasets: [{
                data: [evenCount, oddCount],
                backgroundColor: [
                    'rgba(0, 184, 148, 0.7)',
                    'rgba(214, 48, 49, 0.7)'
                ],
                borderColor: [
                    'rgba(0, 184, 148, 1)',
                    'rgba(214, 48, 49, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: getChartOptions()
    });
    
    const matchesDiffersCtx = document.getElementById('matches-differs-chart').getContext('2d');
    matchesDiffersChart = new Chart(matchesDiffersCtx, {
        type: 'bar',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
            datasets: [{
                data: digitCounts,
                backgroundColor: 'rgba(9, 132, 227, 0.7)',
                borderColor: 'rgba(9, 132, 227, 1)',
                borderWidth: 1
            }]
        },
        options: getChartOptions()
    });
    
    const overUnderCtx = document.getElementById('over-under-chart').getContext('2d');
    overUnderChart = new Chart(overUnderCtx, {
        type: 'bar',
        data: {
            labels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
            datasets: [{
                data: digitCounts,
                backgroundColor: 'rgba(155, 89, 182, 0.7)',
                borderColor: 'rgba(155, 89, 182, 1)',
                borderWidth: 1
            }]
        },
        options: getChartOptions()
    });
    
    const riseFallCtx = document.getElementById('rise-fall-chart').getContext('2d');
    riseFallChart = new Chart(riseFallCtx, {
        type: 'bar',
        data: {
            labels: ['Rise', 'Fall'],
            datasets: [{
                data: [riseCount, fallCount],
                backgroundColor: [
                    'rgba(0, 184, 148, 0.7)',
                    'rgba(214, 48, 49, 0.7)'
                ],
                borderColor: [
                    'rgba(0, 184, 148, 1)',
                    'rgba(214, 48, 49, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: getChartOptions()
    });
}

function getChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#2d3436',
                    stepSize: 1
                },
                grid: {
                    color: 'rgba(45, 52, 54, 0.1)'
                }
            },
            x: {
                ticks: {
                    color: '#2d3436'
                },
                grid: {
                    color: 'rgba(45, 52, 54, 0.1)'
                }
            }
        },
        plugins: {
            legend: {
                display: false
            }
        }
    };
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
    currentCountdown = interval;
    
    stopPredictions();
    
    updateTimerDisplay();
    countdownInterval = setInterval(() => {
        currentCountdown--;
        updateTimerDisplay();
        
        if (currentCountdown <= 0) {
            currentCountdown = interval;
            analyzePredictions();
        }
    }, 1000);
    
    startPredictionsBtn.disabled = true;
    stopPredictionsBtn.disabled = false;
}

function stopPredictions() {
    clearInterval(countdownInterval);
    timerElement.textContent = 'Predictions stopped';
    startPredictionsBtn.disabled = false;
    stopPredictionsBtn.disabled = true;
}

function updateTimerDisplay() {
    timerElement.textContent = `Next analysis in: ${currentCountdown} sec`;
    timerElement.style.color = currentCountdown <= 5 ? '#d63031' : '#0984e3';
}

function analyzePredictions() {
    timerElement.textContent = 'Analyzing predictions...';
    generateSignal();
    
    setTimeout(() => {
        currentCountdown = parseInt(predictionIntervalInput.value) || 30;
        updateTimerDisplay();
    }, 2000);
}

function generateInitialData() {
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
        
        if (i > 0) {
            const prevDigit = tickHistory[i - 1].digit;
            const prevPrice = priceHistory[i - 1];
            
            digitCounts[parseInt(randomDigit)]++;
            totalTicks++;
            
            if (parseInt(randomDigit) % 2 === 0) {
                evenCount++;
            } else {
                oddCount++;
            }
            
            if (randomDigit === prevDigit) {
                matchesCount++;
            } else {
                differsCount++;
            }
            
            if (parseInt(randomDigit) >= 5) {
                overCount++;
            } else {
                underCount++;
            }
            
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
    
    latestTickElement.textContent = lastPrice;
    lastDigitElement.textContent = lastDigit;
    
    updateStatsDisplays();
    updateEvenOddChart();
    updateMatchesDiffersChart();
    updateOverUnderChart();
    updateRiseFallChart();
    generateSignal();
}

function updateTime() {
    const timecodeElement = document.getElementById("timecode");
    const now = new Date();

    const gmtHours = String(now.getUTCHours()).padStart(2, '0');
    const gmtMinutes = String(now.getUTCMinutes()).padStart(2, '0');
    const gmtSeconds = String(now.getUTCSeconds()).padStart(2, '0');
    const gmtTime = `GMT: ${gmtHours}:${gmtMinutes}:${gmtSeconds}`;

    const eatTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const eatHours = String(eatTime.getUTCHours()).padStart(2, '0');
    const eatMinutes = String(eatTime.getUTCMinutes()).padStart(2, '0');
    const eatSeconds = String(eatTime.getUTCSeconds()).padStart(2, '0');
    const eatTimeString = `EAT: ${eatHours}:${eatMinutes}:${eatSeconds}`;

    timecodeElement.textContent = `${eatTimeString} | ${gmtTime}`;
}