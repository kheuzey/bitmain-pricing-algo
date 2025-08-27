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
    
    // Update the historical prices table for selected miner
    updateHistoricalPricesTable(minerKey);
    
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

function updateHistoricalPricesTable(minerKey) {
    const minerName = MINER_SPECS[minerKey]?.name || 'Unknown Miner';
    document.getElementById('selected-miner-name').textContent = minerName;
    
    const tbody = document.getElementById('historical-prices-tbody');
    tbody.innerHTML = ''; // Clear existing rows
    
    // Define key historical data points for each miner
    const historicalData = {
        's9_135': [
            { date: 'Nov 28, 2017', price: '$1,515', btc: '$9,900', context: 'Early bull market rally' },
            { date: 'Dec 8, 2017', price: '$1,520', btc: '$15,000', context: 'Mid bull market' },
            { date: 'Dec 20, 2017', price: '$4,500', btc: '$19,000', context: 'Peak bubble - 3x in 12 days!' },
            { date: 'Jan 3, 2018', price: '$2,830', btc: '$15,000', context: 'Post-peak correction' },
            { date: 'Feb 9, 2018', price: '$2,420', btc: '$8,200', context: 'Market crash' },
            { date: 'Dec 2018', price: '$650', btc: '$3,200', context: 'Bear market floor' }
        ],
        's9_14': [
            { date: 'Nov 28, 2017', price: '$1,515', btc: '$9,900', context: 'Early bull market' },
            { date: 'Dec 20, 2017', price: '$4,500', btc: '$19,000', context: 'Peak bubble' },
            { date: 'Jan 3, 2018', price: '$2,830', btc: '$15,000', context: 'Correction phase' },
            { date: 'Dec 2018', price: '$650', btc: '$3,200', context: 'Bear market floor' }
        ],
        's9i_135': [
            { date: 'June 2017', price: '$2,250', btc: '$2,500', context: 'Launch price' },
            { date: 'Dec 2017', price: '$4,400', btc: '$19,000', context: 'Peak bubble' },
            { date: 'May 2018', price: '$1,350', btc: '$8,500', context: 'Mid-bear market' },
            { date: 'Dec 2018', price: '$650', btc: '$3,200', context: 'Bear market floor' }
        ],
        's9i_14': [
            { date: 'May 2018', price: '$1,450', btc: '$8,500', context: 'Launch during bear' },
            { date: 'Dec 2018', price: '$650', btc: '$3,200', context: 'Bear market floor' },
            { date: 'June 2019', price: '$820', btc: '$9,000', context: 'Recovery phase' }
        ],
        's9j': [
            { date: 'Dec 2017', price: '$4,300', btc: '$19,000', context: 'Launch at peak' },
            { date: 'Jan 2018', price: '$3,000', btc: '$14,000', context: 'Quick correction' },
            { date: 'May 2018', price: '$1,300', btc: '$8,500', context: 'Bear market' },
            { date: 'Dec 2018', price: '$650', btc: '$3,200', context: 'Bear market floor' }
        ],
        't9plus': [
            { date: 'Jan 2017', price: '$1,100', btc: '$1,000', context: 'Early 2017' },
            { date: 'Dec 2017', price: '$3,800', btc: '$19,000', context: 'Peak bubble' },
            { date: 'Dec 2018', price: '$650', btc: '$3,200', context: 'Bear market floor' }
        ],
        's17': [
            { date: 'Apr 2019', price: '$2,500', btc: '$5,200', context: 'Launch price' },
            { date: 'July 2019', price: '$2,800', btc: '$12,000', context: 'Summer rally' },
            { date: 'Mar 2020', price: '$1,500', btc: '$5,000', context: 'COVID crash' },
            { date: 'Apr 2021', price: '$5,500', btc: '$60,000', context: 'Bull market peak' }
        ],
        's17pro': [
            { date: 'Apr 2019', price: '$2,400', btc: '$5,200', context: 'Launch price' },
            { date: 'Mar 2020', price: '$1,450', btc: '$5,000', context: 'COVID crash' },
            { date: 'Apr 2021', price: '$5,300', btc: '$60,000', context: 'Bull market peak' }
        ],
        's19': [
            { date: 'May 2020', price: '$2,400', btc: '$9,000', context: 'Launch price' },
            { date: 'Dec 2020', price: '$4,500', btc: '$20,000', context: 'Bull run begins' },
            { date: 'Apr 2021', price: '$11,000', btc: '$60,000', context: 'Bull market peak' },
            { date: 'Nov 2021', price: '$12,000', btc: '$69,000', context: 'ATH period' },
            { date: 'June 2022', price: '$4,500', btc: '$20,000', context: 'Bear market' },
            { date: 'Nov 2022', price: '$3,000', btc: '$16,000', context: 'FTX crash - floor' }
        ],
        's19pro': [
            { date: 'June 2020', price: '$2,600', btc: '$9,500', context: 'Launch price' },
            { date: 'Apr 2021', price: '$11,500', btc: '$60,000', context: 'Bull market peak' },
            { date: 'Nov 2021', price: '$12,500', btc: '$69,000', context: 'ATH period' },
            { date: 'Nov 2022', price: '$2,100', btc: '$16,000', context: 'FTX crash - floor' }
        ],
        's19xp': [
            { date: 'July 2022', price: '$8,000', btc: '$22,000', context: 'Launch in bear' },
            { date: 'Nov 2022', price: '$5,000', btc: '$16,000', context: 'FTX crash' },
            { date: 'Jan 2024', price: '$4,500', btc: '$42,000', context: 'ETF approval rally' },
            { date: 'Mar 2024', price: '$5,600', btc: '$70,000', context: 'New ATH period' }
        ]
    };
    
    // Get data for selected miner or show generic message
    const minerData = historicalData[minerKey] || [];
    
    if (minerData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                    Historical price data will be displayed here when available for ${minerName}
                </td>
            </tr>
        `;
        return;
    }
    
    // Populate table with miner-specific data
    minerData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.date}</td>
            <td class="price-value">${row.price}</td>
            <td>${row.btc}</td>
            <td><small>${row.context}</small></td>
        `;
        tbody.appendChild(tr);
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