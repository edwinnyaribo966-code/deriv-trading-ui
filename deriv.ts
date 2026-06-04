<!DOCTYPE
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
