let datasets = {};
let listeners = new Set();

let started = false;
let index = 0;
let prices = {};

/**
 * Load dataset once
 */
export function loadDataset(symbol, data) {
  datasets[symbol] = data;
}

/**
 * Subscribe ONLY to prices
 */
export function subscribe(cb) {
  listeners.add(cb);
  cb({ ...prices }); // immediate emit
  return () => listeners.delete(cb);
}

/**
 * Start global simulation clock
 */
export function startSimulation({ intervalMs = 2000 } = {}) {
  if (started) return;
  started = true;

  setInterval(() => {
    index += 1;

    Object.keys(datasets).forEach((symbol) => {
      const row = datasets[symbol]?.[index];
      if (row && typeof row.open === "number") {
        prices[symbol] = row.open;
      }
    });

    listeners.forEach((cb) => cb({ ...prices }));
  }, intervalMs);
}
