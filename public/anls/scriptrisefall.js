     const appId = '63213'; // Replace with your actual app_id
        let ws;
        let latestTicks = [];
        let riseCount = 0;
        let fallCount = 0;

        // Event listeners
        document.getElementById('market-select').addEventListener('change', connectToMarket);
        document.getElementById('tick-select').addEventListener('change', updateTicks);
        document.getElementById('interval-select').addEventListener('change', updateCandlestickData);

        function connectToMarket() {
            const market = document.getElementById('market-select').value;
            if (!market) return;
            if (ws) ws.close();

            ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${appId}`);

            ws.onopen = () => {
                ws.send(JSON.stringify({ ticks: market }));
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.tick) {
                    updateDisplay(data.tick.quote);
                    updateTickHistory(data.tick.quote);
                    calculatePercentages();
                    updateCandlestick(data.tick.quote);
                }
            };
        }

        function updateDisplay(tick) {
            document.getElementById('tick-display').textContent = `Latest Tick: ${tick}`;
        }

        function updateTickHistory(tick) {
            const maxTicks = parseInt(document.getElementById('tick-select').value, 10);
            latestTicks.push(tick);
            if (latestTicks.length > maxTicks) {
                latestTicks.shift();
            }
        }

        function calculatePercentages() {
            riseCount = 0;
            fallCount = 0;

            for (let i = 1; i < latestTicks.length; i++) {
                if (latestTicks[i] > latestTicks[i - 1]) {
                    riseCount++;
                } else if (latestTicks[i] < latestTicks[i - 1]) {
                    fallCount++;
                }
            }

            const totalTicks = latestTicks.length;
            const risePercentage = totalTicks > 0 ? (riseCount / totalTicks * 100).toFixed(2) : 0;
            const fallPercentage = totalTicks > 0 ? (fallCount / totalTicks * 100).toFixed(2) : 0;

            document.getElementById('rise-percentage').textContent = `${risePercentage}%`;
            document.getElementById('fall-percentage').textContent = `${fallPercentage}%`;

            updateBarChart(risePercentage, fallPercentage);
        }

        function updateBarChart(risePercentage, fallPercentage) {
            const riseBar = document.getElementById('rise-bar');
            const fallBar = document.getElementById('fall-bar');

            // Default grey color for both bars
            riseBar.style.backgroundColor = '#D3D3D3'; // Grey color
            fallBar.style.backgroundColor = '#D3D3D3'; // Grey color

            // If there is a rise, turn the rise bar green and set the height to the rise percentage
            if (risePercentage > 0) {
                riseBar.style.backgroundColor = 'green';
                riseBar.style.height = `${risePercentage}%`;
            } else {
                riseBar.style.height = '0%'; // No rise, keep it hidden
            }

            // If there is a fall, turn the fall bar red and set the height to the fall percentage
            if (fallPercentage > 0) {
                fallBar.style.backgroundColor = 'red';
                fallBar.style.height = `${fallPercentage}%`;
            } else {
                fallBar.style.height = '0%'; // No fall, keep it hidden
            }
        }

        function updateCandlestick(tick) {
            const interval = parseInt(document.getElementById('interval-select').value, 10);

            fetchCandlestickData(interval).then(data => {
                const entryPoint = data.entry || '--';
                const closingPoint = data.close || '--';
                const status = data.forming ? 'Candlestick is forming' : 'No candlestick forming';

                // Update the candlestick data table
                const tableBody = document.getElementById('candlestick-data').getElementsByTagName('tbody')[0];
                tableBody.innerHTML = `
                    <tr>
                        <td>${entryPoint}</td>
                        <td>${closingPoint}</td>
                    </tr>
                `;
                document.getElementById('candlestick-status').textContent = `Status: ${status}`;
            });
        }

        function fetchCandlestickData(interval) {
            return new Promise((resolve) => {
                // Simulate fetching data from Deriv API for the selected interval
                // Replace this mock data with actual API call logic
                setTimeout(() => {
                    resolve({
                        entry: (Math.random() * 100).toFixed(2),
                        close: (Math.random() * 100).toFixed(2),
                        forming: Math.random() > 0.5
                    });
                }, 1000);
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('market-select').dispatchEvent(new Event('change'));
        });