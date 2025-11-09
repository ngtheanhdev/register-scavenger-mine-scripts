/**
 * Seed to Wallet Converter Script
 *
 * This script converts a seed.txt file into wallet-input.json format
 * for use with the register-addresses.js script.
 *
 * Usage:
 *   1. Create a seed.txt file with your seed phrases
 *   2. Run: npm run convert
 *   3. The script will create wallet-input.json
 *   4. You can then run: npm run register
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SEED_INPUT_FILE = path.join(__dirname, 'seed.txt');
const WALLET_OUTPUT_FILE = path.join(__dirname, 'wallet-input.json');
const DEFAULT_ADDRESS_COUNT = 10;

/**
 * Parse the seed.txt file
 * Supports two formats:
 * 1. Each word on separate numbered line (1. word1 \n 2. word2 ...)
 * 2. Full seed phrase on one line (1. word1 word2 word3 ...)
 */
function parseSeedFile(content) {
  const wallets = [];

  // Split by separator line (flexible length)
  const sections = content.split(/={5,}/);

  for (const section of sections) {
    const lines = section.trim().split('\n').filter(line => line.trim());

    if (lines.length === 0) continue;

    // First line is the wallet name (e.g., "Work-Chrome", "PC-21", etc.)
    const walletName = lines[0].trim();
    if (!walletName) continue;

    // Collect words from numbered lines
    const words = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      // Match lines like "1. word" or "15. word"
      const wordMatch = line.match(/^(\d+)\.\s+(.+)$/);

      if (wordMatch) {
        const word = wordMatch[2].trim();

        // Skip placeholder words (like seed_x)
        if (word && word !== 'seed_x' && !word.match(/^seed_x$/i)) {
          // Check if this is a single word or a full phrase
          const wordParts = word.split(/\s+/);

          // If the line contains multiple words, treat it as a complete seed phrase
          if (wordParts.length > 1) {
            wallets.push({
              name: walletName,
              seedPhrase: word,
              addressCount: DEFAULT_ADDRESS_COUNT
            });
            // Clear words array as we found a complete phrase
            words.length = 0;
            break;
          } else {
            // Single word - collect it
            words.push(word);
          }
        }
      }
    }

    // If we collected individual words, combine them into a seed phrase
    if (words.length > 0) {
      // Validate word count (should be 12, 15, 18, 21, or 24)
      if (words.length === 12 || words.length === 15 || words.length === 18 ||
          words.length === 21 || words.length === 24) {
        wallets.push({
          name: walletName,
          seedPhrase: words.join(' '),
          addressCount: DEFAULT_ADDRESS_COUNT
        });
      } else {
        console.warn(`⚠️  Warning: Skipping "${walletName}" - Invalid word count: ${words.length} (expected 12, 15, 18, 21, or 24)`);
      }
    }
  }

  return wallets;
}

/**
 * Main function
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Seed to Wallet Converter');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Check if seed.txt exists
    console.log(`📂 Reading input from: ${SEED_INPUT_FILE}`);

    if (!fs.existsSync(SEED_INPUT_FILE)) {
      throw new Error(
        `Input file not found: ${SEED_INPUT_FILE}\n` +
        `Please create a seed.txt file in the project folder.`
      );
    }

    // Step 2: Read and parse seed.txt
    const content = fs.readFileSync(SEED_INPUT_FILE, 'utf8');
    const wallets = parseSeedFile(content);

    if (wallets.length === 0) {
      throw new Error('No valid seed phrases found in seed.txt');
    }

    // Step 3: Create wallet-input.json structure
    const output = {
      wallets: wallets
    };

    // Step 4: Display what we found
    console.log(`✅ Found ${wallets.length} seed phrase(s):\n`);

    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const words = wallet.seedPhrase.trim().split(/\s+/);
      console.log(`   ${i + 1}. ${wallet.name}`);
      console.log(`      Words: ${words.length} | Address Count: ${wallet.addressCount}`);
    }
    console.log('');

    // Step 5: Save to wallet-input.json
    console.log(`💾 Saving to: ${WALLET_OUTPUT_FILE}`);
    fs.writeFileSync(WALLET_OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
    console.log(`✅ Conversion complete!\n`);

    // Step 6: Display next steps
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Next Steps:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  1. Review wallet-input.json to verify the conversion');
    console.log('  2. Run: npm run register');
    console.log('  3. DELETE both seed.txt and wallet-input.json after use!');
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
