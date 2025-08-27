// Virtual vs Physical Mining Calculator
let comparisonChart = null;
let analysisData = null;

// Miner specifications
const MINER_SPECS_COMPARISON = {
    's19pro': { 
        hashrate: 110, // TH/s
        power: 3250, // Watts
        efficiency: 29.5, // J/TH
        name: 'S19 Pro'
    },
    's19': { 
        hashrate: 95, 
        power: 3250, 
        efficiency: 34.2,
        name: 'S19'
    },
    's19xp': { 
        hashrate: 140, 
        power: 3010, 
        efficiency: 21.5,
        name: 'S19 XP'
    },
    's17pro': { 
        hashrate: 53, 
        power: 2094, 
        efficiency: 39.5,
        name: 'S17 Pro'
    },
    's9': { 
        hashrate: 14, 
        power: 1372, 
        efficiency: 98,
        name: 'S9'
    }
};

// Bitcoin network parameters (simplified for demonstration)
const NETWORK_PARAMS = {
    blocksPerDay: 144,
    blockReward: 6.25, // Will halve in 2024
    halvingDate: '2024-04-20',
    avgNetworkHashrate: 400, // EH/s (400,000,000 TH/s) - average for 2021-2024
    difficultyAdjustmentPeriod: 14 // days
};

function runComparison() {
    // Get input values
    const minerModel = document.getElementById('miner-model').value;
    const startDate = new Date(document.getElementById('start-date').value);
    const minerPrice = parseFloat(document.getElementById('miner-price').value);
    const btcStartPrice = parseFloat(document.getElementById('btc-start-price').value);
    const btcEndPrice = parseFloat(document.getElementById('btc-end-price').value);
    const electricityRate = 0.04; // Fixed at $0.04/kWh as requested
    const poolFeePercent = parseFloat(document.getElementById('pool-fee').value) / 100;
    const difficultyIncreasePerYear = parseFloat(document.getElementById('difficulty-increase').value) / 100;
    
    const miner = MINER_SPECS_COMPARISON[minerModel];
    
    // Calculate for 3 years (1095 days)
    const daysToAnalyze = 1095;
    
    // === VIRTUAL MINING STRATEGY ===
    // Buy BTC with the miner purchase price
    const btcBought = minerPrice / btcStartPrice;
    
    // === PHYSICAL MINING STRATEGY ===
    let totalBtcMined = 0;
    let totalElectricityCost = 0;
    let monthlyData = [];
    
    // Calculate daily mining over 3 years
    for (let day = 0; day < daysToAnalyze; day++) {
        // Calculate network difficulty increase over time
        const yearsElapsed = day / 365;
        const difficultyMultiplier = Math.pow(1 + difficultyIncreasePerYear, yearsElapsed);
        const currentNetworkHashrate = NETWORK_PARAMS.avgNetworkHashrate * difficultyMultiplier;
        
        // Check for halving
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + day);
        const blockReward = (currentDate > new Date(NETWORK_PARAMS.halvingDate)) ? 3.125 : 6.25;
        
        // Calculate daily BTC mined
        const myHashrateShare = miner.hashrate / (currentNetworkHashrate * 1000000); // Convert EH/s to TH/s
        const dailyBtcGross = myHashrateShare * blockReward * NETWORK_PARAMS.blocksPerDay;
        const dailyBtcAfterPool = dailyBtcGross * (1 - poolFeePercent);
        
        totalBtcMined += dailyBtcAfterPool;
        
        // Calculate daily electricity cost
        const dailyKwh = (miner.power / 1000) * 24; // Convert W to kW and multiply by 24 hours
        const dailyElectricityCost = dailyKwh * electricityRate;
        totalElectricityCost += dailyElectricityCost;
        
        // Store monthly data for the first year
        if (day % 30 === 0 && day < 365) {
            const month = day / 30;
            const monthlyBtcMined = dailyBtcAfterPool * 30;
            const monthlyElecCost = dailyElectricityCost * 30;
            const monthlyPoolFees = (dailyBtcGross - dailyBtcAfterPool) * 30 * btcStartPrice;
            
            monthlyData.push({
                month: month + 1,
                physicalBtcMined: monthlyBtcMined,
                physicalCosts: monthlyElecCost + monthlyPoolFees,
                physicalNetValue: (monthlyBtcMined * btcStartPrice) - monthlyElecCost - monthlyPoolFees,
                virtualBtcHeld: btcBought,
                virtualValue: btcBought * btcStartPrice
            });
        }
    }
    
    // === VIRTUAL MINING DEDUCTION ===
    // Deduct the same amount of BTC that physical mining would have generated
    const virtualBtcAfterDeduction = btcBought - totalBtcMined;
    
    // === CALCULATE FINAL VALUES ===
    
    // Physical Mining Results
    const physicalBtcValue = totalBtcMined * btcEndPrice;
    const totalPoolFees = (totalBtcMined / (1 - poolFeePercent) - totalBtcMined) * btcEndPrice;
    const hardwareResidual = minerPrice * 0.2; // 20% residual value after 3 years
    const physicalNetProfit = physicalBtcValue - minerPrice - totalElectricityCost + hardwareResidual;
    const physicalROI = (physicalNetProfit / minerPrice) * 100;
    
    // Virtual Mining Results
    const virtualFinalValue = virtualBtcAfterDeduction * btcEndPrice;
    const virtualNetProfit = virtualFinalValue - minerPrice;
    const virtualROI = (virtualNetProfit / minerPrice) * 100;
    
    // Store analysis data for CSV export
    analysisData = {
        parameters: {
            minerModel: miner.name,
            hashrate: miner.hashrate,
            power: miner.power,
            minerPrice: minerPrice,
            btcStartPrice: btcStartPrice,
            btcEndPrice: btcEndPrice,
            electricityRate: electricityRate,
            poolFeePercent: poolFeePercent * 100,
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date(startDate.getTime() + daysToAnalyze * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        physical: {
            investment: minerPrice,
            btcMined: totalBtcMined,
            electricityCosts: totalElectricityCost,
            poolFees: totalPoolFees,
            btcValue: physicalBtcValue,
            residual: hardwareResidual,
            netProfit: physicalNetProfit,
            roi: physicalROI
        },
        virtual: {
            btcBought: btcBought,
            btcDeducted: totalBtcMined,
            btcHeld: virtualBtcAfterDeduction,
            finalValue: virtualFinalValue,
            netProfit: virtualNetProfit,
            roi: virtualROI
        },
        monthlyData: monthlyData
    };
    
    // Update UI
    updateResults();
    updateChart();
    updateMonthlyTable();
    
    // Show results section
    document.getElementById('results').style.display = 'block';
}

function updateResults() {
    if (!analysisData) return;
    
    const { physical, virtual, parameters } = analysisData;
    
    // Physical Mining
    document.getElementById('physical-investment').textContent = `-$${physical.investment.toLocaleString()}`;
    document.getElementById('physical-btc-mined').textContent = `${physical.btcMined.toFixed(4)} BTC`;
    document.getElementById('physical-electricity').textContent = `-$${physical.electricityCosts.toFixed(0).toLocaleString()}`;
    document.getElementById('physical-pool-fees').textContent = `-$${physical.poolFees.toFixed(0).toLocaleString()}`;
    document.getElementById('physical-btc-value').textContent = `$${physical.btcValue.toFixed(0).toLocaleString()}`;
    document.getElementById('physical-residual').textContent = `$${physical.residual.toLocaleString()}`;
    document.getElementById('physical-net-profit').textContent = `$${physical.netProfit.toFixed(0).toLocaleString()}`;
    document.getElementById('physical-net-profit').className = physical.netProfit >= 0 ? 'metric-value positive' : 'metric-value negative';
    document.getElementById('physical-roi').textContent = `${physical.roi.toFixed(1)}%`;
    document.getElementById('physical-roi').className = physical.roi >= 0 ? 'metric-value positive' : 'metric-value negative';
    
    // Virtual Mining
    document.getElementById('virtual-btc-bought').textContent = `${virtual.btcBought.toFixed(4)} BTC`;
    document.getElementById('virtual-purchase-price').textContent = `$${parameters.minerPrice.toLocaleString()}`;
    document.getElementById('virtual-btc-deducted').textContent = `-${virtual.btcDeducted.toFixed(4)} BTC`;
    document.getElementById('virtual-btc-held').textContent = `${virtual.btcHeld.toFixed(4)} BTC`;
    document.getElementById('virtual-final-value').textContent = `$${virtual.finalValue.toFixed(0).toLocaleString()}`;
    document.getElementById('virtual-net-profit').textContent = `$${virtual.netProfit.toFixed(0).toLocaleString()}`;
    document.getElementById('virtual-net-profit').className = virtual.netProfit >= 0 ? 'metric-value positive' : 'metric-value negative';
    document.getElementById('virtual-roi').textContent = `${virtual.roi.toFixed(1)}%`;
    document.getElementById('virtual-roi').className = virtual.roi >= 0 ? 'metric-value positive' : 'metric-value negative';
    
    // Winner Banner
    const difference = virtual.netProfit - physical.netProfit;
    const roiDifference = virtual.roi - physical.roi;
    const winner = difference > 0 ? 'Virtual Mining' : 'Physical Mining';
    const winnerEmoji = difference > 0 ? '🏆' : '⛏️';
    
    document.getElementById('winner-banner').textContent = 
        `${winnerEmoji} ${winner} outperforms by $${Math.abs(difference).toFixed(0).toLocaleString()} (${Math.abs(roiDifference).toFixed(1)}% better ROI)`;
    document.getElementById('winner-banner').style.background = 
        difference > 0 ? 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)' : 'linear-gradient(135deg, #ff9800 0%, #ff6f00 100%)';
}

function updateChart() {
    if (!analysisData) return;
    
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    
    // Generate data points for 36 months
    const labels = [];
    const physicalValues = [];
    const virtualValues = [];
    
    for (let month = 0; month <= 36; month++) {
        labels.push(`Month ${month}`);
        
        // Simplified linear interpolation for demonstration
        const progress = month / 36;
        const btcPrice = analysisData.parameters.btcStartPrice + 
            (analysisData.parameters.btcEndPrice - analysisData.parameters.btcStartPrice) * progress;
        
        // Physical: accumulating BTC minus costs
        const btcMinedSoFar = analysisData.physical.btcMined * progress;
        const costsSoFar = (analysisData.physical.electricityCosts + analysisData.physical.poolFees) * progress;
        const physicalValue = (btcMinedSoFar * btcPrice) - analysisData.parameters.minerPrice - costsSoFar;
        physicalValues.push(physicalValue);
        
        // Virtual: BTC appreciation minus deductions
        const btcHeldSoFar = analysisData.virtual.btcBought - (analysisData.virtual.btcDeducted * progress);
        const virtualValue = (btcHeldSoFar * btcPrice) - analysisData.parameters.minerPrice;
        virtualValues.push(virtualValue);
    }
    
    if (comparisonChart) {
        comparisonChart.destroy();
    }
    
    comparisonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Physical Mining Net Value',
                    data: physicalValues,
                    borderColor: '#ff9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Virtual Mining Net Value',
                    data: virtualValues,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
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
                            return context.dataset.label + ': $' + context.parsed.y.toFixed(0).toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function updateMonthlyTable() {
    if (!analysisData) return;
    
    const tbody = document.getElementById('monthly-tbody');
    tbody.innerHTML = '';
    
    analysisData.monthlyData.forEach(row => {
        const tr = document.createElement('tr');
        const difference = row.virtualValue - row.physicalNetValue;
        tr.innerHTML = `
            <td>Month ${row.month}</td>
            <td>${row.physicalBtcMined.toFixed(6)} BTC</td>
            <td>$${row.physicalCosts.toFixed(0)}</td>
            <td>$${row.physicalNetValue.toFixed(0)}</td>
            <td>${row.virtualBtcHeld.toFixed(6)} BTC</td>
            <td>$${row.virtualValue.toFixed(0)}</td>
            <td style="color: ${difference > 0 ? '#4caf50' : '#f44336'}">
                ${difference > 0 ? '+' : ''}$${difference.toFixed(0)}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function downloadCSV() {
    if (!analysisData) return;
    
    const { parameters, physical, virtual, monthlyData } = analysisData;
    
    // Create CSV content
    let csv = 'Virtual vs Physical Bitcoin Mining - 3 Year Analysis\n\n';
    
    // Parameters section
    csv += 'ANALYSIS PARAMETERS\n';
    csv += `Miner Model,${parameters.minerModel}\n`;
    csv += `Hashrate (TH/s),${parameters.hashrate}\n`;
    csv += `Power Consumption (W),${parameters.power}\n`;
    csv += `Initial Investment,$${parameters.minerPrice}\n`;
    csv += `BTC Start Price,$${parameters.btcStartPrice}\n`;
    csv += `BTC End Price,$${parameters.btcEndPrice}\n`;
    csv += `Electricity Rate ($/kWh),$${parameters.electricityRate}\n`;
    csv += `Pool Fee (%),${parameters.poolFeePercent}%\n`;
    csv += `Analysis Period,${parameters.startDate} to ${parameters.endDate}\n\n`;
    
    // Physical Mining Results
    csv += 'PHYSICAL MINING STRATEGY\n';
    csv += `Initial Investment,-$${physical.investment}\n`;
    csv += `Total BTC Mined,${physical.btcMined.toFixed(8)} BTC\n`;
    csv += `Total Electricity Costs,-$${physical.electricityCosts.toFixed(2)}\n`;
    csv += `Total Pool Fees,-$${physical.poolFees.toFixed(2)}\n`;
    csv += `Final BTC Value,$${physical.btcValue.toFixed(2)}\n`;
    csv += `Hardware Residual Value (20%),$${physical.residual.toFixed(2)}\n`;
    csv += `Net Profit/Loss,$${physical.netProfit.toFixed(2)}\n`;
    csv += `ROI,${physical.roi.toFixed(2)}%\n\n`;
    
    // Virtual Mining Results
    csv += 'VIRTUAL MINING STRATEGY\n';
    csv += `Initial BTC Purchase,${virtual.btcBought.toFixed(8)} BTC\n`;
    csv += `BTC Deducted (Mining Equivalent),-${virtual.btcDeducted.toFixed(8)} BTC\n`;
    csv += `Final BTC Held,${virtual.btcHeld.toFixed(8)} BTC\n`;
    csv += `Final Value,$${virtual.finalValue.toFixed(2)}\n`;
    csv += `Net Profit/Loss,$${virtual.netProfit.toFixed(2)}\n`;
    csv += `ROI,${virtual.roi.toFixed(2)}%\n\n`;
    
    // Comparison Summary
    csv += 'COMPARISON SUMMARY\n';
    const difference = virtual.netProfit - physical.netProfit;
    const winner = difference > 0 ? 'Virtual Mining' : 'Physical Mining';
    csv += `Winner,${winner}\n`;
    csv += `Profit Difference,$${Math.abs(difference).toFixed(2)}\n`;
    csv += `ROI Difference,${Math.abs(virtual.roi - physical.roi).toFixed(2)}%\n\n`;
    
    // Monthly Breakdown (First Year)
    csv += 'MONTHLY BREAKDOWN (FIRST YEAR)\n';
    csv += 'Month,Physical BTC Mined,Physical Costs,Physical Net Value,Virtual BTC Held,Virtual Value,Difference\n';
    
    monthlyData.forEach(row => {
        const diff = row.virtualValue - row.physicalNetValue;
        csv += `${row.month},${row.physicalBtcMined.toFixed(8)},${row.physicalCosts.toFixed(2)},`;
        csv += `${row.physicalNetValue.toFixed(2)},${row.virtualBtcHeld.toFixed(8)},`;
        csv += `${row.virtualValue.toFixed(2)},${diff.toFixed(2)}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `virtual_vs_physical_mining_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set default date to 3 years ago
    const today = new Date();
    const threeYearsAgo = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());
    document.getElementById('start-date').value = threeYearsAgo.toISOString().split('T')[0];
    
    // Set realistic default prices
    document.getElementById('btc-start-price').value = '30000';
    document.getElementById('btc-end-price').value = '70000';
    document.getElementById('miner-price').value = '10000';
});