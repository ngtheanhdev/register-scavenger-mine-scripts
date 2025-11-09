/**
 * Wallet Tracker Statistics Script
 *
 * This script analyzes the wallet-tracker.csv file and provides
 * comprehensive statistics about wallet performance.
 *
 * Usage:
 *   npm run stats
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_INPUT_FILE = path.join(__dirname, 'wallet-tracker.csv');
const STATS_OUTPUT_FILE = path.join(__dirname, 'statistics-report.txt');

/**
 * Parse CSV file
 */
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  // Parse header
  const header = lines[0].split(',');

  // Extract day columns
  const dayColumns = [];
  for (let i = 1; i < header.length; i++) {
    const col = header[i];
    if (col.includes('Day') && col.includes('Solution')) {
      const dayMatch = col.match(/Day (\d+)/);
      if (dayMatch) {
        dayColumns.push({
          day: parseInt(dayMatch[1]),
          solutionIndex: i,
          nightIndex: i + 1
        });
      }
    }
  }

  // Parse wallet data (skip header and last 2 rows which are totals)
  const wallets = [];
  for (let i = 1; i < lines.length - 2; i++) {
    const cells = lines[i].split(',');

    const wallet = {
      address: cells[0],
      totalNight: parseFloat(cells[cells.length - 1]) || 0,
      totalSolution: 0,
      days: []
    };

    // Extract daily data
    for (const dayCol of dayColumns) {
      const solution = parseInt(cells[dayCol.solutionIndex]) || 0;
      const night = parseFloat(cells[dayCol.nightIndex]) || 0;

      wallet.days.push({
        day: dayCol.day,
        solution,
        night
      });

      wallet.totalSolution += solution;
    }

    wallets.push(wallet);
  }

  return { wallets, dayColumns };
}

/**
 * Calculate statistics
 */
function calculateStatistics(wallets, dayColumns) {
  const totalWallets = wallets.length;
  const activeDays = dayColumns.length;

  // Total metrics
  const totalNight = wallets.reduce((sum, w) => sum + w.totalNight, 0);
  const totalSolution = wallets.reduce((sum, w) => sum + w.totalSolution, 0);

  // Average metrics
  const avgNightPerWallet = totalNight / totalWallets;
  const avgSolutionPerWallet = totalSolution / totalWallets;
  const avgSolutionPerDay = totalSolution / activeDays;
  const avgNightPerDay = totalNight / activeDays;

  // Sort wallets by night
  const walletsByNight = [...wallets].sort((a, b) => b.totalNight - a.totalNight);
  const topWalletsByNight = walletsByNight.slice(0, 10);
  const bottomWalletsByNight = walletsByNight.slice(-10).reverse();

  // Sort wallets by solution
  const walletsBySolution = [...wallets].sort((a, b) => b.totalSolution - a.totalSolution);
  const topWalletsBySolution = walletsBySolution.slice(0, 10);
  const bottomWalletsBySolution = walletsBySolution.slice(-10).reverse();

  // Inactive wallets (0 solutions)
  const inactiveWallets = wallets.filter(w => w.totalSolution === 0);

  // Active wallets
  const activeWallets = wallets.filter(w => w.totalSolution > 0);

  // Min/Max metrics
  const maxNight = walletsByNight[0]?.totalNight || 0;
  const minNight = walletsByNight[walletsByNight.length - 1]?.totalNight || 0;
  const maxSolution = walletsBySolution[0]?.totalSolution || 0;
  const minSolution = walletsBySolution[walletsBySolution.length - 1]?.totalSolution || 0;

  // Calculate daily trends
  const dailyStats = dayColumns.map(dayCol => {
    const daySolutions = wallets.reduce((sum, w) => {
      const dayData = w.days.find(d => d.day === dayCol.day);
      return sum + (dayData?.solution || 0);
    }, 0);

    const dayNights = wallets.reduce((sum, w) => {
      const dayData = w.days.find(d => d.day === dayCol.day);
      return sum + (dayData?.night || 0);
    }, 0);

    return {
      day: dayCol.day,
      totalSolutions: daySolutions,
      totalNights: dayNights,
      avgSolutionsPerWallet: daySolutions / totalWallets,
      avgNightsPerWallet: dayNights / totalWallets
    };
  });

  // Calculate consistency (wallets with solutions every day)
  const consistentWallets = wallets.filter(w => {
    return w.days.every(d => d.solution > 0);
  });

  // Distribution of night allocation
  const nightRanges = {
    '0': 0,
    '1-500': 0,
    '501-1000': 0,
    '1001-2000': 0,
    '2001-3000': 0,
    '3000+': 0
  };

  wallets.forEach(w => {
    if (w.totalNight === 0) nightRanges['0']++;
    else if (w.totalNight <= 500) nightRanges['1-500']++;
    else if (w.totalNight <= 1000) nightRanges['501-1000']++;
    else if (w.totalNight <= 2000) nightRanges['1001-2000']++;
    else if (w.totalNight <= 3000) nightRanges['2001-3000']++;
    else nightRanges['3000+']++;
  });

  return {
    totalWallets,
    activeDays,
    totalNight,
    totalSolution,
    avgNightPerWallet,
    avgSolutionPerWallet,
    avgSolutionPerDay,
    avgNightPerDay,
    topWalletsByNight,
    bottomWalletsByNight,
    topWalletsBySolution,
    bottomWalletsBySolution,
    inactiveWallets,
    activeWallets,
    maxNight,
    minNight,
    maxSolution,
    minSolution,
    dailyStats,
    consistentWallets,
    nightRanges
  };
}

/**
 * Format number with thousand separators
 */
function formatNumber(num, decimals = 2) {
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Truncate address for display
 */
function truncateAddress(address, start = 15, end = 10) {
  if (address.length <= start + end) return address;
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
}

/**
 * Generate report
 */
function generateReport(stats) {
  let report = '';

  report += '═══════════════════════════════════════════════════════════════\n';
  report += '  WALLET TRACKER STATISTICS REPORT\n';
  report += '  Generated: ' + new Date().toLocaleString() + '\n';
  report += '═══════════════════════════════════════════════════════════════\n\n';

  // Overview
  report += '📊 OVERVIEW\n';
  report += '─────────────────────────────────────────────────────────────\n';
  report += `  Total Wallets:              ${stats.totalWallets}\n`;
  report += `  Active Wallets:             ${stats.activeWallets.length} (${((stats.activeWallets.length / stats.totalWallets) * 100).toFixed(1)}%)\n`;
  report += `  Inactive Wallets:           ${stats.inactiveWallets.length} (${((stats.inactiveWallets.length / stats.totalWallets) * 100).toFixed(1)}%)\n`;
  report += `  Consistent Wallets:         ${stats.consistentWallets.length} (submitted every day)\n`;
  report += `  Tracking Days:              ${stats.activeDays}\n`;
  report += '\n';

  // Total Metrics
  report += '🎯 TOTAL METRICS\n';
  report += '─────────────────────────────────────────────────────────────\n';
  report += `  Total Solutions:            ${formatNumber(stats.totalSolution, 0)}\n`;
  report += `  Total Night Allocation:     ${formatNumber(stats.totalNight, 4)}\n`;
  report += '\n';

  // Average Metrics
  report += '📈 AVERAGE METRICS\n';
  report += '─────────────────────────────────────────────────────────────\n';
  report += `  Avg Solutions per Wallet:   ${formatNumber(stats.avgSolutionPerWallet, 2)}\n`;
  report += `  Avg Night per Wallet:       ${formatNumber(stats.avgNightPerWallet, 4)}\n`;
  report += `  Avg Solutions per Day:      ${formatNumber(stats.avgSolutionPerDay, 2)}\n`;
  report += `  Avg Night per Day:          ${formatNumber(stats.avgNightPerDay, 4)}\n`;
  report += '\n';

  // Min/Max Metrics
  report += '📏 MIN/MAX METRICS\n';
  report += '─────────────────────────────────────────────────────────────\n';
  report += `  Highest Solutions:          ${formatNumber(stats.maxSolution, 0)}\n`;
  report += `  Lowest Solutions:           ${formatNumber(stats.minSolution, 0)}\n`;
  report += `  Highest Night:              ${formatNumber(stats.maxNight, 4)}\n`;
  report += `  Lowest Night:               ${formatNumber(stats.minNight, 4)}\n`;
  report += '\n';

  // Top Wallets by Night
  report += '🏆 TOP 10 WALLETS BY NIGHT ALLOCATION\n';
  report += '─────────────────────────────────────────────────────────────\n';
  stats.topWalletsByNight.forEach((w, i) => {
    report += `  ${String(i + 1).padStart(2)}. ${truncateAddress(w.address, 20, 12)} | Night: ${formatNumber(w.totalNight, 4).padStart(12)} | Solutions: ${String(w.totalSolution).padStart(4)}\n`;
  });
  report += '\n';

  // Top Wallets by Solution
  report += '🎖️  TOP 10 WALLETS BY SOLUTIONS\n';
  report += '─────────────────────────────────────────────────────────────\n';
  stats.topWalletsBySolution.forEach((w, i) => {
    report += `  ${String(i + 1).padStart(2)}. ${truncateAddress(w.address, 20, 12)} | Solutions: ${String(w.totalSolution).padStart(4)} | Night: ${formatNumber(w.totalNight, 4).padStart(12)}\n`;
  });
  report += '\n';

  // Bottom Wallets by Night (if any active)
  if (stats.bottomWalletsByNight.length > 0 && stats.bottomWalletsByNight[0].totalNight > 0) {
    report += '⬇️  BOTTOM 10 WALLETS BY NIGHT ALLOCATION\n';
    report += '─────────────────────────────────────────────────────────────\n';
    stats.bottomWalletsByNight.forEach((w, i) => {
      report += `  ${String(i + 1).padStart(2)}. ${truncateAddress(w.address, 20, 12)} | Night: ${formatNumber(w.totalNight, 4).padStart(12)} | Solutions: ${String(w.totalSolution).padStart(4)}\n`;
    });
    report += '\n';
  }

  // Night Distribution
  report += '📊 NIGHT ALLOCATION DISTRIBUTION\n';
  report += '─────────────────────────────────────────────────────────────\n';
  const ranges = ['0', '1-500', '501-1000', '1001-2000', '2001-3000', '3000+'];
  ranges.forEach(range => {
    const count = stats.nightRanges[range];
    const percentage = ((count / stats.totalWallets) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(percentage / 2));
    report += `  ${range.padEnd(12)}: ${String(count).padStart(4)} wallets (${percentage.padStart(5)}%) ${bar}\n`;
  });
  report += '\n';

  // Daily Trends
  report += '📅 DAILY TRENDS\n';
  report += '─────────────────────────────────────────────────────────────\n';
  report += '  Day | Total Solutions | Total Night    | Avg Sol/Wallet | Avg Night/Wallet\n';
  report += '  ────┼─────────────────┼────────────────┼────────────────┼──────────────────\n';
  stats.dailyStats.forEach(day => {
    report += `  ${String(day.day).padStart(3)} | ${formatNumber(day.totalSolutions, 0).padStart(15)} | ${formatNumber(day.totalNights, 2).padStart(14)} | ${formatNumber(day.avgSolutionsPerWallet, 2).padStart(14)} | ${formatNumber(day.avgNightsPerWallet, 4).padStart(16)}\n`;
  });
  report += '\n';

  // Inactive Wallets (show only count and first few)
  if (stats.inactiveWallets.length > 0) {
    report += `⚠️  INACTIVE WALLETS (${stats.inactiveWallets.length} total, showing first 10)\n`;
    report += '─────────────────────────────────────────────────────────────\n';
    stats.inactiveWallets.slice(0, 10).forEach((w, i) => {
      report += `  ${String(i + 1).padStart(2)}. ${w.address}\n`;
    });
    if (stats.inactiveWallets.length > 10) {
      report += `  ... and ${stats.inactiveWallets.length - 10} more\n`;
    }
    report += '\n';
  }

  report += '═══════════════════════════════════════════════════════════════\n';
  report += '  End of Report\n';
  report += '═══════════════════════════════════════════════════════════════\n';

  return report;
}

/**
 * Main function
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Wallet Tracker Statistics');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Check if CSV file exists
    console.log(`📂 Reading data from: ${CSV_INPUT_FILE}`);

    if (!fs.existsSync(CSV_INPUT_FILE)) {
      throw new Error(
        `CSV file not found: ${CSV_INPUT_FILE}\n` +
        `Please run 'npm run track' first to generate the tracking data.`
      );
    }

    // Step 2: Read and parse CSV
    const content = fs.readFileSync(CSV_INPUT_FILE, 'utf8');
    const { wallets, dayColumns } = parseCSV(content);

    console.log(`✅ Loaded ${wallets.length} wallets with ${dayColumns.length} days of data\n`);

    // Step 3: Calculate statistics
    console.log(`📊 Calculating statistics...`);
    const stats = calculateStatistics(wallets, dayColumns);
    console.log(`✅ Statistics calculated\n`);

    // Step 4: Generate report
    console.log(`📝 Generating report...`);
    const report = generateReport(stats);

    // Step 5: Display report to console
    console.log(report);

    // Step 6: Save report to file
    console.log(`💾 Saving report to: ${STATS_OUTPUT_FILE}`);
    fs.writeFileSync(STATS_OUTPUT_FILE, report, 'utf8');
    console.log(`✅ Report saved successfully\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  📊 Statistics Summary');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total Wallets:          ${stats.totalWallets}`);
    console.log(`  Active Wallets:         ${stats.activeWallets.length}`);
    console.log(`  Total Solutions:        ${formatNumber(stats.totalSolution, 0)}`);
    console.log(`  Total Night:            ${formatNumber(stats.totalNight, 4)}`);
    console.log(`  Avg Solutions/Wallet:   ${formatNumber(stats.avgSolutionPerWallet, 2)}`);
    console.log(`  Avg Night/Wallet:       ${formatNumber(stats.avgNightPerWallet, 4)}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    console.error('\n');
    process.exit(1);
  }
}

// Run the script
main();
