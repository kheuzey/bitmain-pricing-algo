// UI Calculator for Bitmain Pricing Algorithm
let priceChart = null;

// Miner specifications
const MINER_SPECS = {
    's9_135': { name: 'S9 13.5 TH/s', hashrate: 13.5, launch: '2016-06' },
    's9_14': { name: 'S9 14 TH/s', hashrate: 14, launch: '2016-09' },
    's9i_135': { name: 'S9i 13.5 TH/s', hashrate: 13.5, launch: '2017-06' },
    's9i_14': { name: 'S9i 14 TH/s', hashrate: 14, launch: '2018-05' },
    's9j': { name: 'S9j 14.5 TH/s', hashrate: 14.5, launch: '2017-12' },
    't9plus': { name: 'T9+ 10.5 TH/s', hashrate: 10.5, launch: '2017-01' },
    's17': { name: 'S17 56 TH/s', hashrate: 56, launch: '2019-04' },
    's17pro': { name: 'S17 Pro 53 TH/s', hashrate: 53, launch: '2019-04' },
    's19': { name: 'S19 95 TH/s', hashrate: 95, launch: '2020-05' },
    's19pro': { name: 'S19 Pro 110 TH/s', hashrate: 110, launch: '2020-06' },
    's19xp': { name: 'S19 XP 140 TH/s', hashrate: 140, launch: '2022-07' }
};

function calculatePrice() {
    const minerKey = document.getElementById('miner-select').value;
    const date = document.getElementById('date-select').value;
    const btcPrice = parseFloat(document.getElementById('btc-price-input').value);
    const btc30dAgo = parseFloat(document.getElementById('btc-30d-ago').value);
    
    if (!minerKey) {
        alert('Please select a miner model');
        return;
    }
    
    // Try simple pricing first (guaranteed historical data)
    let price = null;
    let method = 'Unknown';
    let marketPhase = 'Normal';
    let multiplier = 1.0;
    let basePrice = 0;
    let btcMomentum = 0;
    
    // Calculate BTC momentum
    btcMomentum = ((btcPrice - btc30dAgo) / btc30dAgo * 100).toFixed(1);
    
    // Try simple historical pricing first
    if (typeof getSimpleMinerPrice !== 'undefined') {
        price = getSimpleMinerPrice(minerKey, date);
        if (price) {
            method = 'Historical Data';
        }
    }
    
    // If no historical price, try dynamic pricing
    if (!price && typeof getDynamicMinerPrice !== 'undefined') {
        const dynamicResult = getDynamicMinerPrice(minerKey, date, btcPrice);
        if (dynamicResult) {
            price = dynamicResult;
            method = 'Dynamic Algorithm';
            
            // Determine market phase based on date and BTC momentum
            if (date >= '2017-12-15' && date <= '2017-12-25') {
                marketPhase = 'Peak Bubble';
                multiplier = 3.0;
            } else if (btcMomentum > 30) {
                marketPhase = 'FOMO Rally';
                multiplier = 2.0;
            } else if (btcMomentum > 10) {
                marketPhase = 'Bull Market';
                multiplier = 1.5;
            } else if (btcMomentum < -30) {
                marketPhase = 'Crash';
                multiplier = 0.85;
            } else if (btcMomentum < -10) {
                marketPhase = 'Bear Market';
                multiplier = 0.9;
            }
        }
    }
    
    // If still no price, use analyze-price-patterns formula
    if (!price && typeof getRealMinerPrice !== 'undefined') {
        const result = getRealMinerPrice(minerKey, date, btcPrice, btc30dAgo);
        if (result) {
            price = result.price;
            method = 'Pattern Analysis';
            marketPhase = result.marketPhase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            multiplier = result.multiplier;
            btcMomentum = result.btcMomentum.toFixed(1);
        }
    }
    
    // Calculate base price
    const miner = MINER_SPECS[minerKey];
    if (miner) {
        const basePricePerTh = minerKey.startsWith('s9') ? 120 : 
                               minerKey.startsWith('s17') ? 80 : 
                               minerKey.startsWith('s19') ? 60 : 100;
        basePrice = miner.hashrate * basePricePerTh;
    }
    
    // Display results
    if (price) {
        document.getElementById('results').style.display = 'block';
        document.getElementById('calculated-price').textContent = `$${price.toLocaleString()}`;
        document.getElementById('price-method').textContent = method;
        document.getElementById('market-phase').textContent = marketPhase;
        document.getElementById('btc-momentum').textContent = `${btcMomentum}%`;
        document.getElementById('price-multiplier').textContent = `${multiplier.toFixed(1)}x`;
        document.getElementById('base-price').textContent = `$${basePrice.toLocaleString()}`;
        
        // Set phase indicator color
        const phaseElement = document.getElementById('market-phase');
        phaseElement.style.background = getPhaseColor(marketPhase);
        phaseElement.style.color = 'white';
        phaseElement.style.padding = '10px 20px';
        phaseElement.style.borderRadius = '8px';
        
        // Update chart
        updatePriceChart(minerKey, date, price);
    } else {
        alert('Unable to calculate price for this miner and date combination');
    }
}

function getPhaseColor(phase) {
    const phaseColors = {
        'Peak Bubble': '#ff9800',
        'FOMO Rally': '#ff9800',
        'Extreme Bull': '#4caf50',
        'Strong Bull': '#4caf50',
        'Bull Market': '#4caf50',
        'Normal': '#795548',
        'Recovery': '#2196f3',
        'Relief Rally': '#2196f3',
        'Bear Market': '#f44336',
        'Crash': '#8b0000',
        'Correction': '#f44336'
    };
    return phaseColors[phase] || '#795548';
}

function updatePriceChart(minerKey, selectedDate, currentPrice) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    // Get historical prices for this miner
    const prices = [];
    const dates = [];
    
    // Generate dates from launch to 2024
    const miner = MINER_SPECS[minerKey];
    if (!miner) return;
    
    const startDate = new Date(miner.launch + '-01');
    const endDate = new Date('2024-01-01');
    
    // Sample monthly prices
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
        const dateStr = d.toISOString().substring(0, 7);
        let price = null;
        
        // Try to get price for this date
        if (typeof getSimpleMinerPrice !== 'undefined') {
            price = getSimpleMinerPrice(minerKey, dateStr);
        }
        
        if (price) {
            dates.push(dateStr);
            prices.push(price);
        }
    }
    
    // Add the current calculated point
    if (currentPrice && selectedDate) {
        const dateStr = selectedDate.substring(0, 7);
        if (!dates.includes(dateStr)) {
            // Find insertion point
            let inserted = false;
            for (let i = 0; i < dates.length; i++) {
                if (dates[i] > dateStr) {
                    dates.splice(i, 0, dateStr);
                    prices.splice(i, 0, currentPrice);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                dates.push(dateStr);
                prices.push(currentPrice);
            }
        }
    }
    
    // Create or update chart
    if (priceChart) {
        priceChart.destroy();
    }
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: MINER_SPECS[minerKey].name + ' Price (USD)',
                data: prices,
                borderColor: '#558b2f',
                backgroundColor: 'rgba(124, 179, 66, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: dates.map(d => d === selectedDate?.substring(0, 7) ? 8 : 3),
                pointBackgroundColor: dates.map(d => d === selectedDate?.substring(0, 7) ? '#ff9800' : '#558b2f'),
                pointBorderWidth: dates.map(d => d === selectedDate?.substring(0, 7) ? 3 : 1)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Price: $${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Initialize date input with today's date
document.addEventListener('DOMContentLoaded', function() {
    // Set some example dates
    document.getElementById('date-select').value = '2017-12-20';
    document.getElementById('btc-price-input').value = '19000';
    document.getElementById('btc-30d-ago').value = '10000';
    
    // Auto-update BTC prices based on common dates
    document.getElementById('date-select').addEventListener('change', function(e) {
        const date = e.target.value;
        const btcPrices = {
            '2017-11-28': { current: 9900, past: 7000 },
            '2017-12-08': { current: 15000, past: 10000 },
            '2017-12-20': { current: 19000, past: 15000 },
            '2018-01-03': { current: 15000, past: 19000 },
            '2018-02-09': { current: 8200, past: 13000 },
            '2018-03-01': { current: 10900, past: 8200 },
            '2018-05-01': { current: 9100, past: 6800 },
            '2019-06-26': { current: 13000, past: 8000 },
            '2020-12-16': { current: 21000, past: 19000 },
            '2021-04-14': { current: 64000, past: 60000 },
            '2021-11-10': { current: 69000, past: 65000 }
        };
        
        // Check if we have preset prices for this date
        if (btcPrices[date]) {
            document.getElementById('btc-price-input').value = btcPrices[date].current;
            document.getElementById('btc-30d-ago').value = btcPrices[date].past;
        }
    });
});