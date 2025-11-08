/**
 * Standalone Address Registration Script
 *
 * This script registers Cardano wallet addresses with the Midnight Scavenger API.
 * It's completely independent and doesn't require the Next.js server to be running.
 *
 * Usage:
 *   1. npm install (one time, to install dependencies)
 *   2. Create wallet-input.json with your seed phrase(s)
 *   3. npm run register
 *   4. DELETE wallet-input.json after completion (security!)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Lucid } from 'lucid-cardano';
import axios from 'axios';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE = 'https://scavenger.prod.gd.midnighttge.io';
const RATE_LIMIT_MS = 1500; // 1.5 seconds between registrations
const INPUT_FILE = path.join(__dirname, 'wallet-input.json');
const OUTPUT_FILE = path.join(__dirname, 'registration-results.json');

// Helper to convert string to hex
function toHex(str) {
  return Buffer.from(str, 'utf8').toString('hex');
}

// Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Derive a single address from seed phrase
 */
async function deriveAddress(seedPhrase, index) {
  try {
    const lucid = await Lucid.new(undefined, 'Mainnet');
    lucid.selectWalletFromSeed(seedPhrase, { accountIndex: index });

    const address = await lucid.wallet.address();

    // Extract public key by signing a test message
    const testPayload = toHex('test');
    const signedMessage = await lucid.wallet.signMessage(address, testPayload);
    const pubKeyHex = signedMessage.key.slice(-64);

    if (pubKeyHex.length !== 64) {
      throw new Error(`Invalid public key length: ${pubKeyHex.length}`);
    }

    return {
      index,
      bech32: address,
      publicKeyHex: pubKeyHex,
      registered: false,
    };
  } catch (error) {
    return {
      index,
      bech32: '',
      publicKeyHex: '',
      registered: false,
      error: error.message,
    };
  }
}

/**
 * Sign a message with the wallet
 */
async function signMessage(seedPhrase, addressIndex, address, message) {
  const lucid = await Lucid.new(undefined, 'Mainnet');
  lucid.selectWalletFromSeed(seedPhrase, { accountIndex: addressIndex });

  const payload = toHex(message);
  const signedMessage = await lucid.wallet.signMessage(address, payload);

  return signedMessage.signature;
}

/**
 * Register a single address with Midnight API
 */
async function registerAddress(seedPhrase, addr) {
  try {
    if (addr.error || !addr.bech32) {
      return false;
    }

    // Step 1: Get Terms & Conditions message
    const tandcResp = await axios.get(`${API_BASE}/TandC`, { timeout: 10000 });
    const message = tandcResp.data.message;

    // Step 2: Sign the message
    const signature = await signMessage(seedPhrase, addr.index, addr.bech32, message);

    // Step 3: Register with API
    const registerUrl = `${API_BASE}/register/${addr.bech32}/${signature}/${addr.publicKeyHex}`;
    await axios.post(registerUrl, {}, { timeout: 10000 });

    addr.registered = true;
    addr.registrationTime = new Date().toISOString();
    return true;
  } catch (error) {
    addr.error = error.response?.data?.message || error.message || 'Unknown error';
    addr.registered = false;
    return false;
  }
}

/**
 * Process a single wallet
 */
async function processWallet(wallet, walletIndex) {
  const walletName = wallet.name || `Wallet ${walletIndex + 1}`;
  const words = wallet.seedPhrase.trim().split(/\s+/);

  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`Processing: ${walletName}`);
  console.log(`Seed phrase: ${words.length} words`);
  console.log(`Address count: ${wallet.addressCount}`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);

  // Step 1: Derive addresses
  console.log(`📍 Deriving ${wallet.addressCount} addresses...`);
  const addresses = [];

  for (let i = 0; i < wallet.addressCount; i++) {
    const addr = await deriveAddress(wallet.seedPhrase, i);
    addresses.push(addr);

    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Derived ${i + 1}/${wallet.addressCount} addresses`);
    }
  }

  console.log(`✅ Derived all ${addresses.length} addresses\n`);

  // Step 2: Register addresses
  console.log(`🚀 Registering ${addresses.length} addresses...`);
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    const success = await registerAddress(wallet.seedPhrase, addr);

    if (success) {
      successCount++;
      console.log(`   ✅ [${i + 1}/${addresses.length}] Registered: ${addr.bech32.substring(0, 20)}...`);
    } else {
      failCount++;
      console.log(`   ✗ [${i + 1}/${addresses.length}] Failed: ${addr.error}`);
    }

    // Progress update every 10 addresses
    if ((i + 1) % 10 === 0) {
      console.log(`\n   📊 Progress: ${i + 1}/${addresses.length} | Success: ${successCount} | Failed: ${failCount}\n`);
    }

    // Rate limiting
    if (i < addresses.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  const result = {
    walletName,
    seedPhraseWords: words.length,
    totalAddresses: addresses.length,
    successfulRegistrations: successCount,
    failedRegistrations: failCount,
    addresses,
    completedAt: new Date().toISOString(),
  };

  console.log(`\n✅ [${walletName}] Completed: ${successCount}/${addresses.length} successful\n`);

  return result;
}

/**
 * Main function
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Midnight Address Registration Script');
  console.log('  Standalone Version - No Server Required');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Read input file
    console.log(`📂 Reading input from: ${INPUT_FILE}`);

    if (!fs.existsSync(INPUT_FILE)) {
      throw new Error(
        `Input file not found: ${INPUT_FILE}\n` +
        `Please create wallet-input.json in the scripts/ folder.\n` +
        `See wallet-input.sample.json for the format.`
      );
    }

    const input = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

    // Support both formats
    let wallets = [];

    if (input.wallets && Array.isArray(input.wallets)) {
      wallets = input.wallets;
    } else if (input.seedPhrase && input.addressCount) {
      wallets = [{
        name: 'Single Wallet',
        seedPhrase: input.seedPhrase,
        addressCount: input.addressCount,
      }];
    } else {
      throw new Error(
        'Invalid input format. Expected:\n' +
        '{\n' +
        '  "wallets": [\n' +
        '    { "name": "Wallet 1", "seedPhrase": "...", "addressCount": 40 }\n' +
        '  ]\n' +
        '}'
      );
    }

    // Step 2: Validate wallets
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];

      if (!wallet.seedPhrase || typeof wallet.seedPhrase !== 'string') {
        throw new Error(`Wallet ${i + 1}: Missing seedPhrase`);
      }

      if (!wallet.addressCount || wallet.addressCount < 1) {
        throw new Error(`Wallet ${i + 1}: Missing addressCount`);
      }

      const words = wallet.seedPhrase.trim().split(/\s+/);
      if (words.length !== 15 && words.length !== 24) {
        throw new Error(
          `Wallet ${i + 1} (${wallet.name || 'Unnamed'}): Invalid seed phrase length: ${words.length} words\n` +
          `Must be 15 or 24 words.`
        );
      }
    }

    // Step 3: Display configuration
    console.log(`✅ Loaded configuration:`);
    console.log(`   Total wallets: ${wallets.length}`);
    for (let i = 0; i < wallets.length; i++) {
      const wallet = wallets[i];
      const words = wallet.seedPhrase.trim().split(/\s+/);
      console.log(`   ${i + 1}. ${wallet.name || `Wallet ${i + 1}`}: ${words.length} words, ${wallet.addressCount} addresses`);
    }
    console.log('');

    // Calculate estimated time
    const totalAddresses = wallets.reduce((sum, w) => sum + w.addressCount, 0);
    const estimatedMinutes = Math.ceil((totalAddresses * 1.5) / 60);
    console.log(`⏱️  Estimated time: ~${estimatedMinutes} minutes (${totalAddresses} addresses × 1.5s each)\n`);

    // Step 4: Process each wallet
    const results = [];
    for (let i = 0; i < wallets.length; i++) {
      const result = await processWallet(wallets[i], i);
      results.push(result);
    }

    // Step 5: Calculate totals
    const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRegistrations, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failedRegistrations, 0);

    const finalResult = {
      totalWallets: wallets.length,
      totalAddresses,
      totalSuccessfulRegistrations: totalSuccessful,
      totalFailedRegistrations: totalFailed,
      wallets: results,
      completedAt: new Date().toISOString(),
    };

    // Step 6: Save results
    console.log(`💾 Saving results to: ${OUTPUT_FILE}`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalResult, null, 2), 'utf8');
    console.log(`✅ Results saved successfully\n`);

    // Step 7: Display summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  📊 Registration Summary');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total wallets:          ${finalResult.totalWallets}`);
    console.log(`  Total addresses:        ${finalResult.totalAddresses}`);
    console.log(`  ✅ Successful:          ${finalResult.totalSuccessfulRegistrations}`);
    console.log(`  ✗ Failed:               ${finalResult.totalFailedRegistrations}`);
    console.log(`  Success rate:           ${((finalResult.totalSuccessfulRegistrations / finalResult.totalAddresses) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════════════════════════');

    // Per-wallet breakdown
    if (wallets.length > 1) {
      console.log('\n📋 Per-Wallet Breakdown:\n');
      for (let i = 0; i < results.length; i++) {
        const wallet = results[i];
        console.log(`  ${i + 1}. ${wallet.walletName}`);
        console.log(`     Addresses: ${wallet.totalAddresses} | Success: ${wallet.successfulRegistrations} | Failed: ${wallet.failedRegistrations}`);
        console.log(`     Success rate: ${((wallet.successfulRegistrations / wallet.totalAddresses) * 100).toFixed(1)}%`);
        console.log('');
      }
      console.log('═══════════════════════════════════════════════════════════════');
    }

    if (finalResult.totalFailedRegistrations > 0) {
      console.log('⚠️  Some registrations failed. Check registration-results.json for details.\n');
      process.exit(1);
    } else {
      console.log('🎉 All addresses registered successfully!\n');
      process.exit(0);
    }

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
