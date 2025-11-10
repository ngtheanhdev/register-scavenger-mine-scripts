import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Constants
// ============================================================================

const API_CHALLENGE = 'https://scavenger.prod.gd.midnighttge.io/challenge';
const API_STATS = 'https://scavenger.prod.gd.midnighttge.io/statistics/';
const WALLETS_FILE = path.join(__dirname, 'wallets.txt');
const OUTPUT_FILE = path.join(__dirname, 'wallet-tracker.csv');

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Shorten wallet address for display
 */
function shortenAddress(addr) {
  if (addr.length <= 24) return addr;
  return `${addr.slice(0, 20)}...${addr.slice(-3)}`;
}

/**
 * Get current challenge day from API
 */
async function getCurrentDay() {
  try {
    const response = await axios.get(API_CHALLENGE, {
      timeout: 10000,
      headers: { 'User-Agent': 'wallet-tracker-nodejs' }
    });
    return response.data?.challenge?.day || 0;
  } catch (error) {
    console.error('❌ Failed to fetch challenge API:', error.message);
    throw error;
  }
}

/**
 * Get wallet statistics from API
 */
async function getWalletStats(wallet) {
  try {
    const url = `${API_STATS}${wallet}`;
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'wallet-tracker-nodejs' }
    });

    const data = response.data;
    const solution = Math.round(data?.local?.crypto_receipts || 0);
    const nightRaw = data?.local?.night_allocation || 0;
    const nightAlloc = Math.round((nightRaw / 1_000_000) * 10000) / 10000;

    return { solution, nightAlloc };
  } catch (error) {
    console.warn(`⚠️  Failed to fetch stats for ${shortenAddress(wallet)}:`, error.message);
    return { solution: 0, nightAlloc: 0 };
  }
}

/**
 * Parse CSV file into structured data
 */
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    const row = {};

    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }

    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Read existing CSV data if file exists
 */
function readExistingData() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    return { existingData: {}, existingColumns: [] };
  }

  try {
    const csvContent = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const { headers, rows } = parseCSV(csvContent);

    const existingData = {};
    const existingColumns = headers.filter(h =>
      h !== 'Wallet Address' && h !== 'Total Night per address'
    );

    for (const row of rows) {
      const wallet = row['Wallet Address'];
      if (!wallet || wallet === 'Total Solution' || wallet === 'Total Night') {
        continue;
      }

      existingData[wallet] = {};
      for (const col of existingColumns) {
        const value = parseFloat(row[col]) || 0;
        existingData[wallet][col] = value;
      }
    }

    return { existingData, existingColumns };
  } catch (error) {
    console.warn('⚠️  Failed to read existing CSV, starting fresh:', error.message);
    return { existingData: {}, existingColumns: [] };
  }
}

/**
 * Generate CSV content from data
 */
function generateCSV(wallets, allColumns, data) {
  const headers = ['Wallet Address', ...allColumns];
  const csvLines = [headers.join(',')];

  // Wallet rows
  for (const wallet of wallets) {
    const row = [wallet];

    for (let i = 0; i < allColumns.length; i++) {
      const col = allColumns[i];
      const value = data[wallet]?.[col] || 0;
      row.push(value);
    }

    csvLines.push(row.join(','));
  }

  return csvLines.join('\n');
}

// ============================================================================
// Main Function
// ============================================================================

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Midnight Challenge Tracker');
    console.log('  Track wallet challenge submissions');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 1. Read wallets.txt
    if (!fs.existsSync(WALLETS_FILE)) {
      throw new Error(`❌ File wallets.txt not found at: ${WALLETS_FILE}`);
    }

    const walletsContent = fs.readFileSync(WALLETS_FILE, 'utf-8');
    const wallets = walletsContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (wallets.length === 0) {
      throw new Error('❌ No wallets found in wallets.txt');
    }

    console.log(`📖 Loaded ${wallets.length} wallets\n`);

    // 2. Get current challenge day
    console.log('🌐 Fetching current challenge day...');
    const currentDay = await getCurrentDay();
    const colSolution = `Day ${currentDay} Solution`;
    const colNight = `Day ${currentDay} Night`;
    console.log(`🗓  Current challenge day: ${currentDay}\n`);

    // 3. Read existing data
    console.log('📂 Reading existing tracking data...');
    const { existingData, existingColumns } = readExistingData();
    console.log(`✅ Found ${existingColumns.length} existing day columns\n`);

    // 4. Fetch stats for all wallets
    console.log('🚀 Fetching wallet statistics...\n');
    const newData = {};

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const { solution, nightAlloc } = await getWalletStats(wallet);

      console.log(`   [${i + 1}/${wallets.length}] ${shortenAddress(wallet)} -> Solution: ${solution} | Night: ${nightAlloc.toFixed(4)}`);

      newData[wallet] = { solution, nightAlloc };

      // Rate limiting: 500ms delay between requests
      if (i < wallets.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n✅ Fetched all wallet statistics\n');

    // 5. Merge data
    console.log('🔄 Merging data...');
    const mergedData = {};

    for (const wallet of wallets) {
      mergedData[wallet] = { ...(existingData[wallet] || {}) };

      if (newData[wallet]) {
        mergedData[wallet][colSolution] = newData[wallet].solution;
        mergedData[wallet][colNight] = newData[wallet].nightAlloc;
      }
    }

    // 6. Build column list
    const allColumns = [...existingColumns];
    if (!allColumns.includes(colSolution)) {
      allColumns.push(colSolution);
      allColumns.push(colNight);
    }

    // 7. Generate and save CSV
    console.log('💾 Generating CSV file...');
    const csvContent = generateCSV(wallets, allColumns, mergedData);
    fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf-8');

    console.log(`✅ Successfully saved to: ${OUTPUT_FILE}\n`);

    // 8. Summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  📊 Tracking Summary');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total wallets tracked:  ${wallets.length}`);
    console.log(`  Current day:            ${currentDay}`);
    console.log(`  Total day columns:      ${allColumns.length / 2}`);
    console.log(`  Output file:            ${path.basename(OUTPUT_FILE)}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🎉 Challenge tracking completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
