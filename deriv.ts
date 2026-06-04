<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Market Dashboard</title>
    <!-- Modern Styling via Tailwind CSS CDN -->
    <script src="https://jsdelivr.net"></script>
    <style>
        body { background-color: #0b0f19; color: #f3f4f6; }
    </style>
</head>
<body class="font-sans antialiased">

    <!-- Top Navigation Bar -->
    <nav class="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-3">
            <span class="text-xl font-bold tracking-wider text-red-500">LIVE</span>
            <span class="text-xl font-semibold">Market Terminal</span>
        </div>
        <div class="flex items-center space-x-4">
            <!-- Connection Status Indicator -->
            <div class="flex items-center space-x-2 bg-gray-800 px-3 py-1.5 rounded-full text-xs font-medium">
                <span id="status-dot" class="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse"></span>
                <span id="status-text" class="text-gray-300">Connecting...</span>
            </div>
            <button id="account-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Live Account
            </button>
        </div>
    </nav>

    <!-- Main Dashboard Workspace -->
    <main class="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Side: Market Metrics & Controls -->
        <div class="space-y-6 lg:col-span-1">
            <!-- Account Balance Card -->
            <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
                <h2 class="text-sm font-medium text-gray-400 uppercase tracking-wider">Available Balance</h2>
                <div class="mt-2 flex items-baseline space-x-2">
                    <span class="text-3xl font-extrabold tracking-tight">$</span>
                    <span id="balance-amount" class="text-3xl font-extrabold tracking-tight">0.00</span>
                    <span class="text-sm font-semibold text-gray-400">USD</span>
                </div>
                <p id="account-id-display" class="mt-1 text-xs text-gray-500">ID: Demo/Public Mode</p>
            </div>

            <!-- Market Selector & Order Placer -->
            <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
                <h3 class="text-lg font-semibold text-white">Market Controls</h3>
                
                <div>
                    <label class="block text-xs font-medium text-gray-400 mb-1">Select Volatility Index</label>
                    <select id="market-select" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white">
                        <option value="R_10">Volatility 10 Index</option>
                        <option value="R_50">Volatility 50 Index</option>
                        <option value="R_100" selected>Volatility 100 Index</option>
                    </select>
                </div>

                <div class="pt-2">
                    <div class="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Latest Feed Tick</span>
                        <span id="tick-timestamp">--:--:--</span>
                    </div>
                    <div id="live-tick-price" class="text-2xl font-mono font-bold text-center bg-gray-950 py-3 rounded-lg border border-gray-800 text-gray-400">
                        0.0000
                    </div>
                </div>
            </div>
        </div>

        <!-- Right Side: Live Log Stream Container -->
        <div class="lg:col-span-2 space-y-6">
            <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm h-full flex flex-col min-h-[400px]">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-white">Live Data Feed Terminal</h3>
                    <span class="text-xs bg-gray-800 text-blue-400 px-2 py-1 rounded">Real-time Stream</span>
                </div>
                <!-- Interactive Log Container -->
                <div id="log-terminal" class="flex-1 bg-gray-950 border border-gray-800 rounded-lg font-mono text-xs text-green-400 p-4 overflow-y-auto h-64 space-y-1">
                    <div>[System] Initializing application framework...</div>
                </div>
            </div>
        </div>

    </main>

    <!-- Correct Live Market Data Feed Script -->
    <script>
        // Official Public Deriv WebSockets Endpoint (App ID 1089 is default for testing)
        const DERIV_WS_URL = "wss://://binaryws.com";
        let socket;
        let currentSymbol = "";
        
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        const priceDisplay = document.getElementById('live-tick-price');
        const timeDisplay = document.getElementById('tick-timestamp');
        const marketSelect = document.getElementById('market-select');
        const logTerminal = document.getElementById('log-terminal');

        function appendLog(message, type = 'info') {
            const logLine = document.createElement('div');
            const timestamp = new Date().toLocaleTimeString();
            logLine.innerText = `[${timestamp}] ${message}`;
            if (type === 'error') logLine.className = 'text-red-500';
            if (type === 'success') logLine.className = 'text-blue-400';
            logTerminal.appendChild(logLine);
            logTerminal.scrollTop = logTerminal.scrollHeight; // Auto scroll
        }

        function initWebSocket() {
            appendLog("Establishing active WebSocket handshake with Deriv servers...");
            socket = new WebSocket(DERIV_WS_URL);

            socket.onopen = () => {
                statusDot.className = "w-2.5 h-2.5 bg-green-500 rounded-full";
                statusText.innerText = "Connected to Deriv Feed";
                appendLog("WebSocket connection successfully verified.", "success");
                
                // Immediately stream selected default market
                changeMarketStream(marketSelect.value);
                
                // Start a safe 30-second ping timer to prevent the server from disconnecting idle sockets
                startHeartbeat();
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);

                // Handle Incoming Live Feed Ticks
                if (data.msg_type === 'tick' && data.tick) {
                    const tick = data.tick;
                    const oldPrice = parseFloat(priceDisplay.innerText) || 0;
                    const newPrice = parseFloat(tick.quote);

                    // Update UI text values
                    priceDisplay.innerText = newPrice.toFixed(tick.pip_size || 4);
                    timeDisplay.innerText = new Date(tick.epoch * 1000).toLocaleTimeString();

                    // Flash dynamic style colors based on price ticks up or down
                    if (newPrice > oldPrice) {
                        priceDisplay.className = "text-2xl font-mono font-bold text-center bg-gray-950 py-3 rounded-lg border border-green-800 text-green-400";
                    } else if (newPrice < oldPrice) {
                        priceDisplay.className = "text-2xl font-mono font-bold text-center bg-gray-950 py-3 rounded-lg border border-red-800 text-red-400";
                    }
                    
                    appendLog(`Tick Received: ${tick.symbol} -> ${newPrice}`, 'tick');
                }
            };

            socket.onerror = (error) => {
                appendLog("Stream socket encountered an explicit structural error.", "error");
                statusDot.className = "w-2.5 h-2.5 bg-red-500 rounded-full animate-none";
                statusText.innerText = "Connection Error";
            };

            socket.onclose = () => {
                appendLog("Network socket closed. Attempting reconnect sequence in 5 seconds...", "error");
                statusDot.className = "w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse";
                statusText.innerText = "Reconnecting...";
                setTimeout(initWebSocket, 5000);
            };
        }

        function changeMarketStream(newSymbol) {
            // Forget previous subscription if one is active to prevent bandwidth bleed
            if (currentSymbol && socket.readyState === WebSocket.OPEN) {
                appendLog(`Forgetting stream channel for: ${currentSymbol}`);
                socket.send(JSON.stringify({ forget_all: "ticks" }));
            }

            currentSymbol = newSymbol;
            
            // Send official Deriv JSON data packet structure requesting live continuous ticks
            if (socket.readyState === WebSocket.OPEN) {
                appendLog(`Subscribing to live continuous stream channel for asset: ${newSymbol}`);
                socket.send(JSON.stringify({
                    ticks: newSymbol,
                    subscribe: 1
                }));
            }
        }

        function startHeartbeat() {
            setInterval(() => {
                if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ ping: 1 }));
                }
            }, 30000); // Send ping data packet clear every 30 seconds
        }

        // Setup event listener to handle layout select dropdown changes instantly
        marketSelect.addEventListener('change', (e) => {
            changeMarketStream(e.target.value);
        });

        // Initialize script logic automatically
