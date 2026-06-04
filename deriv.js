
// Your Deriv Configuration
const APP_ID = '1089'; 
const API_TOKEN = '33sSwGhNKohL4qgSshZxY';
const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

let socket;
let heartbeatInterval;

// Helper to print logs onto your dashboard terminal screen
function appendLog(message, type = 'Info') {
    const logTerminal = document.getElementById('log-terminal');
    if (!logTerminal) return;
    
    const logLine = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString();
    logLine.innerText = `[${timestamp}] ${message}`;
    
    if (type === 'error') logLine.className = 'text-red-500';
    if (type === 'success') logLine.className = 'text-green-400';
    if (type === 'tick') logLine.className = 'text-gray-400';
    
    logTerminal.appendChild(logLine);
    logTerminal.scrollTop = logTerminal.scrollHeight; // Auto-scroll
}

// Initialize the live market connection
function initWebSocket() {
    appendLog("Establishing active WebSocket handshake with Deriv servers...", "Info");
    socket = new WebSocket(DERIV_WS_URL);

    socket.onopen = () => {
        const statusText = document.getElementById('statusText');
        if (statusText) statusText.innerText = "Connected to Deriv Feed";
        appendLog("WebSocket connection successfully verified.", "success");
        
        // Authenticate with your token
        socket.send(JSON.stringify({ authorize: API_TOKEN }));
        startHeartbeat();
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // Handle successful login
        if (data.msg_type === 'authorize' && !data.error) {
            appendLog(`Authenticated successfully as: ${data.authorize.email}`, "success");
            // Stream default market: Volatility 100 (1s) Index
            socket.send(JSON.stringify({ ticks: 'R_100' }));
        }

        // Handle errors
        if (data.error) {
            appendLog(`Deriv API Error: ${data.error.message}`, "error");
            return;
        }

        // Handle live prices
        if (data.tick) {
            const livePrice = data.tick.quote;
            const priceDisplay = document.getElementById('price');
            if (priceDisplay) {
                priceDisplay.innerText = `$${livePrice.toFixed(2)}`;
            }
            appendLog(`Tick Received: ${data.tick.symbol} -> $${livePrice.toFixed(2)}`, 'tick');
        }
    };

    socket.onerror = (error) => {
        appendLog("Stream socket encountered an explicit structural error.", "error");
        const statusText = document.getElementById('statusText');
        if (statusText) statusText.innerText = "Connection Error";
    };
    
    socket.onclose = () => {
        appendLog("Network socket closed. Attempting reconnect sequence in 5 seconds...", "error");
        const statusText = document.getElementById('statusText');
        if (statusText) statusText.innerText = "Reconnecting...";
        clearInterval(heartbeatInterval);
        setTimeout(initWebSocket, 5000);
    };
}

// Keep connection alive by pinging server every 30 seconds
function startHeartbeat() {
    clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ ping: 1 }));
        }
    }, 30000);
}

// Handle market stream dropdown changes
function changeMarketStream(newSymbol) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        appendLog(`Changing stream channel to: ${newSymbol}`, "Info");
        socket.send(JSON.stringify({ forget_all: "ticks" }));
        socket.send(JSON.stringify({ ticks: newSymbol }));
    }
}

// Boot up the connection and link dropdown events when page loads
window.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    
    const marketSelect = document.getElementById('marketSelect');
    if (marketSelect) {
        marketSelect.addEventListener('change', (e) => {
            changeMarketStream(e.target.value);
        });
    }
});
