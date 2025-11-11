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

  // Parse wallet data (no more total rows at the end)
  const wallets = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');

    const wallet = {
      address: cells[0],
      totalNight: 0, // Will be set to the latest day's night snapshot
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

    // Set totalNight to the latest day's snapshot (last day in the list)
    if (wallet.days.length > 0) {
      wallet.totalNight = wallet.days[wallet.days.length - 1].night;
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
  const avgNightPerWallet = totalNight / totalWallets; // Average of latest snapshot
  const avgSolutionPerWallet = totalSolution / totalWallets;
  const avgSolutionPerDay = totalSolution / activeDays;

  // Sort wallets by night
  const walletsByNight = [...wallets].sort((a, b) => b.totalNight - a.totalNight);
  const topWalletsByNight = walletsByNight.slice(0, 10);
  const bottomWalletsByNight = walletsByNight.slice(-10).reverse();

  // Sort wallets by solution
  const walletsBySolution = [...wallets].sort((a, b) => b.totalSolution - a.totalSolution);
  const topWalletsBySolution = walletsBySolution.slice(0, 10);
  const bottomWalletsBySolution = walletsBySolution.slice(-10).reverse();

  // Min/Max metrics
  const maxNight = walletsByNight[0]?.totalNight || 0;
  const minNight = walletsByNight[walletsByNight.length - 1]?.totalNight || 0;
  const maxSolution = walletsBySolution[0]?.totalSolution || 0;
  const minSolution = walletsBySolution[walletsBySolution.length - 1]?.totalSolution || 0;

  // Calculate daily trends with growth metrics
  // First pass: Calculate basic stats for each day
  const dailyStats = dayColumns.map((dayCol) => {
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
      nightSnapshot: dayNights, // This is a snapshot, not a daily total
      avgSolutionsPerWallet: daySolutions / totalWallets,
      avgNightSnapshotPerWallet: dayNights / totalWallets,
      solutionGrowth: 0,
      nightGrowth: 0
    };
  });

  // Second pass: Calculate growth metrics
  for (let i = 1; i < dailyStats.length; i++) {
    const prevDay = dailyStats[i - 1];
    const currentDay = dailyStats[i];

    currentDay.nightGrowth = currentDay.nightSnapshot - prevDay.nightSnapshot;
    currentDay.solutionGrowth = currentDay.totalSolutions - prevDay.totalSolutions;
  }

  // Distribution of night allocation
  const nightRanges = {
    '0-10': 0,
    '10-50': 0,
    '50-100': 0,
    '100-200': 0,
    '200-300': 0,
    '300-400': 0,
    '400-500': 0,
    '500+': 0
  };

  wallets.forEach(w => {
    if (w.totalNight <= 10) nightRanges['0-10']++;
    else if (w.totalNight <= 50) nightRanges['10-50']++;
    else if (w.totalNight <= 100) nightRanges['50-100']++;
    else if (w.totalNight <= 200) nightRanges['100-200']++;
    else if (w.totalNight <= 300) nightRanges['200-300']++;
    else if (w.totalNight <= 400) nightRanges['300-400']++;
    else if (w.totalNight <= 500) nightRanges['400-500']++;
    else nightRanges['500+']++;
  });

  return {
    totalWallets,
    activeDays,
    totalNight,
    totalSolution,
    avgNightPerWallet,
    avgSolutionPerWallet,
    avgSolutionPerDay,
    topWalletsByNight,
    bottomWalletsByNight,
    topWalletsBySolution,
    bottomWalletsBySolution,
    maxNight,
    minNight,
    maxSolution,
    minSolution,
    dailyStats,
    nightRanges
  };
}

/**
 * Format number with thousand separators
 */
function formatNumber(num, decimals = 2) {
  const parts = num.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
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
  report += `  Tracking Days:              ${stats.activeDays}\n`;
  report += '\n';

  // Total Metrics
  report += '🎯 TOTAL METRICS\n';
  report += '─────────────────────────────────────────────────────────────\n';
  report += `  Total Solutions:            ${formatNumber(stats.totalSolution, 0)}\n`;
  report += `  Total Night Allocation:     ${formatNumber(stats.totalNight, 4)} (latest snapshot)\n`;
  report += '\n';

  // Average Metrics
  report += '📈 AVERAGE METRICS\n';
  report += '─────────────────────────────────────────────────────────────\n';
  report += `  Avg Solutions per Wallet:   ${formatNumber(stats.avgSolutionPerWallet, 2)}\n`;
  report += `  Avg Night per Wallet:       ${formatNumber(stats.avgNightPerWallet, 4)} (from latest snapshot)\n`;
  report += `  Avg Solutions per Day:      ${formatNumber(stats.avgSolutionPerDay, 2)}\n`;
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
  const ranges = ['0-10', '10-50', '50-100', '100-200', '200-300', '300-400', '400-500', '500+'];
  ranges.forEach(range => {
    const count = stats.nightRanges[range];
    const percentage = ((count / stats.totalWallets) * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(percentage / 2));
    report += `  ${range.padEnd(12)}: ${String(count).padStart(4)} wallets (${percentage.padStart(5)}%) ${bar}\n`;
  });
  report += '\n';

  // Daily Trends
  report += '📅 DAILY TRENDS\n';
  report += '─────────────────────────────────────────────────────────────────────────────────────────────────\n';
  report += '  Day | Total Solutions | Night Snapshot | Sol Growth | Night Growth | Avg Sol/Wallet | Avg Night/Wallet\n';
  report += '  ────┼─────────────────┼────────────────┼────────────┼──────────────┼────────────────┼──────────────────\n';
  stats.dailyStats.forEach(day => {
    const solGrowth = day.solutionGrowth === 0 && day.day === stats.dailyStats[0].day ? '-' : formatNumber(day.solutionGrowth, 0);
    const nightGrowth = day.nightGrowth === 0 && day.day === stats.dailyStats[0].day ? '-' : formatNumber(day.nightGrowth, 4);

    report += `  ${String(day.day).padStart(3)} | ${formatNumber(day.totalSolutions, 0).padStart(15)} | ${formatNumber(day.nightSnapshot, 2).padStart(14)} | ${String(solGrowth).padStart(10)} | ${String(nightGrowth).padStart(12)} | ${formatNumber(day.avgSolutionsPerWallet, 2).padStart(14)} | ${formatNumber(day.avgNightSnapshotPerWallet, 4).padStart(16)}\n`;
  });
  report += '\n';

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
