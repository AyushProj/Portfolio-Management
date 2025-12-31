const API_BASE_URL = "http://127.0.0.1:5000";

export async function fetchTrades() {
  const response = await fetch(`${API_BASE_URL}/trades`);
  if (!response.ok) {
    throw new Error("Failed to fetch trades");
  }
  return response.json();
}

export async function fetchPositions() {
  const response = await fetch(`${API_BASE_URL}/positions`);
  if (!response.ok) {
    throw new Error("Failed to fetch positions");
  }
  return response.json();
}

export async function fetchPnL() {
  const response = await fetch(`${API_BASE_URL}/pnl`);
  if (!response.ok) {
    throw new Error("Failed to fetch PnL");
  }
  return response.json();
}

export async function createTrade(tradeData) {
  const response = await fetch(`${API_BASE_URL}/trades`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tradeData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Trade failed");
  }

  return response.json();
}
