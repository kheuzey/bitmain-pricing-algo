// Test suite for Bitmain pricing algorithms
const { getSimpleMinerPrice, HISTORICAL_MINER_PRICES } = require('./simple-miner-pricing.js');

console.log('🧪 Testing Bitmain Pricing Algorithms\n');
console.log('=' .repeat(50));

// Test guaranteed historical prices
console.log('\n✅ Testing Guaranteed Historical Prices:\n');

const guaranteedPrices = [
    { miner: 's9_135', date: '2017-11-28', expected: 1515, description: 'November 28, 2017' },
    { miner: 's9_135', date: '2017-12-08', expected: 1520, description: 'December 8, 2017' },
    { miner: 's9_135', date: '2017-12-20', expected: 4500, description: 'Peak bubble - December 20, 2017' },
    { miner: 's9_135', date: '2018-01-03', expected: 2830, description: 'January 3, 2018' },
    { miner: 's9_135', date: '2018-02', expected: 2420, description: 'February 9, 2018' },
];

guaranteedPrices.forEach(test => {
    const price = getSimpleMinerPrice(test.miner, test.date);
    const match = price === test.expected ? '✅' : '❌';
    console.log(`${match} ${test.description}: ${test.miner}`);
    console.log(`   Expected: $${test.expected}, Got: $${price}`);
    if (price !== test.expected) {
        console.log(`   ERROR: Price mismatch!`);
    }
});

// Test interpolation
console.log('\n📊 Testing Price Interpolation:\n');

const interpolationTests = [
    { miner: 's9_135', date: '2017-12-15', description: 'Mid-December 2017 (between $1520 and $4500)' },
    { miner: 's9_135', date: '2018-01-15', description: 'Mid-January 2018 (after crash)' },
    { miner: 's19', date: '2021-01', description: 'January 2021 (S19 during bull run)' },
];

interpolationTests.forEach(test => {
    const price = getSimpleMinerPrice(test.miner, test.date);
    if (price) {
        console.log(`📈 ${test.description}: ${test.miner}`);
        console.log(`   Interpolated price: $${price}`);
    } else {
        console.log(`❌ ${test.description}: No price available`);
    }
});

// Test edge cases
console.log('\n🔧 Testing Edge Cases:\n');

const edgeCases = [
    { miner: 's9_135', date: '2016-01', description: 'Before launch (should return null)' },
    { miner: 's9_135', date: '2025-01', description: 'Future date (should depreciate from last known)' },
    { miner: 'invalid_miner', date: '2018-01', description: 'Invalid miner (should return null)' },
];

edgeCases.forEach(test => {
    const price = getSimpleMinerPrice(test.miner, test.date);
    console.log(`🔍 ${test.description}:`);
    console.log(`   Result: ${price ? `$${price}` : 'null (as expected)'}`);
});

// Test price floors
console.log('\n🛡️ Testing Price Floors:\n');

const floorTests = [
    { miner: 's9_135', date: '2018-12', expected: 650, description: 'S9 at bear market bottom' },
    { miner: 't9plus', date: '2018-12', expected: 650, description: 'T9+ at bear market bottom' },
];

floorTests.forEach(test => {
    const price = getSimpleMinerPrice(test.miner, test.date);
    const match = price >= test.expected ? '✅' : '❌';
    console.log(`${match} ${test.description}:`);
    console.log(`   Minimum expected: $${test.expected}, Got: $${price}`);
});

// Summary statistics
console.log('\n📊 Summary Statistics:\n');

const s9Prices = HISTORICAL_MINER_PRICES['s9_135'];
if (s9Prices) {
    const prices = Object.values(s9Prices);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const maxDate = Object.entries(s9Prices).find(([_, p]) => p === max)?.[0];
    const minDate = Object.entries(s9Prices).find(([_, p]) => p === min)?.[0];
    
    console.log(`S9 13.5 TH/s Historical Range:`);
    console.log(`  📈 Maximum: $${max} (${maxDate})`);
    console.log(`  📉 Minimum: $${min} (${minDate})`);
    console.log(`  📊 Range: $${max - min}`);
    console.log(`  🔄 Max/Min Ratio: ${(max/min).toFixed(2)}x`);
}

// Performance insights
console.log('\n💡 Key Insights from Historical Data:\n');
console.log('• Miners can 3x in price in just 12 days during extreme FOMO');
console.log('• Miner prices decline slower than BTC (sticky prices)');
console.log('• S9 never dropped below $650 even in worst bear market');
console.log('• Counter-trend rallies occur even in bearish periods');
console.log('• Supply shortages cause prices to rise 3x faster than BTC');

console.log('\n' + '=' .repeat(50));
console.log('✅ Testing complete!');
console.log('\nView the full UI at: index.html');
console.log('GitHub repository: https://github.com/kheuzey/bitmain-pricing-algo');