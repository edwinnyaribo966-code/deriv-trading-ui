// Your Configuration
const APP_ID = '1089';
const DERIV_WS_URL = `wss://derivws.com?app_id=${APP_ID}`;
let socket;
let heartbeatInterval;

// Select your HTML elements
const connectBtn = document.getElementById('connect-btn');
const tokenInput = document.getElementById('api-token');
const marketSelect = document.getElementById('market-select'); 
const priceDisplay = document.getElementById('price-display');   

// Helper to log actions to your visual terminal box
function appendLog(message, type = 'Info') {
    const logTerminal = document.getElementById('log-terminal');
    if (!logTerminal) return;

    const logLine = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();
    logLine.innerText = `[${timestamp}] [${type}] ${message}`;
    logLine.className = `log-${type.toLowerCase()}`;
    
    logTerminal.appendChild(logLine);
    logTerminal.scrollTop = logTerminal.scrollHeight;
}

// Main function to establish connection
function initializeTerminal() {
    const token = tokenInput.value.trim();
    if (!token) {
        alert("Please enter a valid API token first!");
        return;
    }

    appendLog("Establishing active WebSocket handshake with Deriv servers...", "System");
    socket = new WebSocket(DERIV_WS_URL);

    // 1. Connection Opened
    socket.onopen = function() {
        appendLog("WebSocket connection successfully verified.", "Success");
        socket.send(JSON.stringify({ authorize: token }));

        // Heartbeat ping every 30 seconds
        heartbeatInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ ping: 1 }));
            }
        }, 30000);
    };

    // 2. Data Packets Received
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.msg_type === 'ping') return;

        if (data.error) {
            appendLog(`Deriv API Error: ${data.error.message}`, "Error");
            return;
        }

        if (data.msg_type === 'authorize') {
            appendLog(`Authorized successfully as ${data.authorize.email}`, "Success");
            startPriceStream();
        }

        if (data.msg_type === 'tick' && data.tick) {
            const currentPrice = data.tick.quote;
            priceDisplay.innerText = `$${parseFloat(currentPrice).toFixed(4)}`;
        }
    };

    // 3. Connection Disconnects
    socket.onclose = function() {
        appendLog("WebSocket connection closed.", "Warn");
        clearInterval(heartbeatInterval);
    };

    // 4. Transport Errors
    socket.onerror = function(error) {
        appendLog("A transport level error occurred.", "Error");
    };
}

function startPriceStream() {
    const selectedAsset = marketSelect.value; 
    appendLog(`Subscribing to real-time feed for: ${selectedAsset}`, "System");
    socket.send(JSON.stringify({ ticks: selectedAsset }));
}

connectBtn.addEventListener('click', initializeTerminal);