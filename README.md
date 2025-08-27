# Bitmain Pricing Algorithm 📊

A comprehensive pricing algorithm and analysis tool for historical Bitmain ASIC miner prices, based on real market data and guaranteed historical prices.

## Overview

This repository contains a sophisticated pricing algorithm that accurately determines historical and current prices for Bitmain ASIC miners. The algorithm is based on:

- **Guaranteed historical prices** from actual invoices and market data
- **Market condition analysis** (bull/bear cycles)
- **BTC price correlation**
- **Supply and demand dynamics**
- **Hardware generation lifecycle patterns**

## Features

- 📈 **Historical Price Database**: Verified prices for S9, S17, S19 series and more
- 🔄 **Dynamic Pricing Calculator**: Real-time price calculations based on market conditions
- 📊 **Market Analysis Tools**: Correlation analysis between BTC price and miner prices
- 🎯 **Accuracy**: Based on guaranteed historical prices from actual transactions
- 📉 **Price Interpolation**: Smart interpolation for dates without exact data
- 💹 **Market Phase Detection**: Identifies bubble, crash, recovery, and normal periods

## Supported Miners

### S9 Generation (2016-2019)
- Antminer S9 (13.5 TH/s)
- Antminer S9 (14 TH/s)
- Antminer S9i (13.5 TH/s)
- Antminer S9i (14 TH/s)
- Antminer S9j (14.5 TH/s)
- Antminer T9+ (10.5 TH/s)

### S17 Generation (2019-2020)
- Antminer S17 (56 TH/s)
- Antminer S17 Pro (53 TH/s)
- Antminer S17+ (73 TH/s)
- Antminer T17 (40 TH/s)

### S19 Generation (2020-present)
- Antminer S19 (95 TH/s)
- Antminer S19 Pro (110 TH/s)
- Antminer S19j (90 TH/s)
- Antminer S19j Pro (104 TH/s)
- Antminer S19 XP (140 TH/s)

## Key Price Points (Guaranteed Historical Data)

| Date | Model | Price | BTC Price | Market Condition |
|------|-------|-------|-----------|------------------|
| 2017-11-28 | S9 13.5 TH/s | $1,515 | ~$9,900 | Early Bull |
| 2017-12-08 | S9 13.5 TH/s | $1,520 | ~$15,000 | Mid Bull |
| 2017-12-20 | S9 13.5 TH/s | $4,500 | ~$19,000 | Peak Bubble |
| 2018-01-03 | S9 13.5 TH/s | $2,830 | ~$13,657 | Correction |
| 2018-02-09 | S9 13.5 TH/s | $2,420 | ~$8,200 | Crash |

## Installation

```bash
git clone https://github.com/yourusername/bitmain-pricing-algo.git
cd bitmain-pricing-algo
```

### Browser Usage
```html
<script src="simple-miner-pricing.js"></script>
<script src="bitmain-dynamic-pricing-calculator.js"></script>
```

### Node.js Usage
```javascript
const { getSimpleMinerPrice } = require('./simple-miner-pricing.js');
const BitmainPricingCalculator = require('./bitmain-dynamic-pricing-calculator.js');
```

## Usage Examples

### Get Historical Price
```javascript
// Get S9 price on specific date
const price = getSimpleMinerPrice('s9_135', '2018-01-03');
console.log(price); // 2830

// Get S19 price with interpolation
const s19Price = getSimpleMinerPrice('s19', '2021-06-15');
console.log(s19Price); // Interpolated price
```

### Dynamic Price Calculation
```javascript
const calculator = new BitmainPricingCalculator();
const result = calculator.calculatePrice('S9', 15000, '2017-12-08');
console.log(result); 
// { price: 1520, marketCondition: 'normal', multiplier: 1.09 }
```

### Market Analysis
```javascript
// Analyze price patterns during bubble
const analysis = analyzer.analyzeBubbleBehavior('2017-12');
// Shows: Miners can 3x in 12 days during extreme FOMO
```

## Pricing Insights

### Bubble Behavior (Dec 2017)
- S9 price **TRIPLED** from $1,520 to $4,500 in just 12 days
- Miner prices rose 3x faster than BTC price
- Extreme supply shortage and FOMO drove prices

### Crash Behavior (2018)
- Sticky prices during decline (slower to fall than BTC)
- Never below $650 floor (manufacturing cost + hardware value)
- Recovery rallies even in bear trends

### Price Floors
- S9: Never below $650
- S17: Never below $1,500
- S19: Never below $3,000

## API Reference

### `getSimpleMinerPrice(minerKey, date)`
Returns the historical price for a specific miner on a given date.

### `BitmainPricingCalculator.calculatePrice(model, btcPrice, date, options)`
Calculates dynamic price based on market conditions.

### `estimateMinerPrice(minerKey, date)`
Fallback estimation when exact historical data is unavailable.

## Data Sources

- Guaranteed prices from actual invoices and transactions
- Historical BTC price data from Blockchain.com
- Network hashrate and difficulty data
- Market analysis from 2016-2024

## Contributing

Contributions are welcome! Please ensure any price data additions include:
- Source documentation
- Transaction proof if available
- Market context

## License

MIT License - See LICENSE file for details

## Disclaimer

This pricing algorithm is for research and analysis purposes. Actual miner prices may vary based on:
- Regional availability
- Bulk order discounts
- Shipping and customs fees
- Market manipulation
- Supply chain disruptions

## Contact

For questions or additional historical price data, please open an issue.

---

**Note**: This algorithm was developed through extensive analysis of actual historical transactions and market data. The guaranteed prices have been verified through actual invoices and contemporaneous market records.