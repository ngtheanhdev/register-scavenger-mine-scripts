/**
 * Consolidation/Donation Script for Scavenger Mine
 *
 * This script consolidates Scavenger Mine allocations from multiple donor addresses
 * to a single recipient address using the /donate_to API endpoint.
 *
 * Usage:
 *   1. Create wallet-donor-input.json with your donor seed phrases
 *   2. npm run donate <recipient_address>
 *   3. Review the generated donation-signatures.json
 *   4. Confirm to execute donations
 *
 * The script works in two phases:
 *   Phase 1: Generate signatures (safe, reusable)
 *   Phase 2: Execute API calls (can be retried)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Lucid } from 'lucid-cardano';
import axios from 'axios';
import readline from 'readline';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE = 'https://scavenger.prod.gd.midnighttge.io';
const RATE_LIMIT_MS = 1500; // 1.5 seconds between API calls
const INPUT_FILE = path.join(__dirname, 'wallet-donor-input.json');
const SIGNATURE_FILE = path.join(__dirname, 'donation-signatures.json');
const OUTPUT_FILE = path.join(__dirname, 'consolidation-results.json');

// Helper to convert string to hex
function toHex(str) {
  return Buffer.from(str, 'utf8').toString('hex');
}

// Sleep function
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Ask user for confirmation
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer);
  }));
}

/**
 * Derive address and sign donation message
 * Public key is NOT needed for /donate_to endpoint
 */
async function deriveAddressAndSign(seedPhrase, addressIndex, recipientAddress) {
  try {
    const lucid = await Lucid.new(undefined, 'Mainnet');
    lucid.selectWalletFromSeed(seedPhrase, { accountIndex: addressIndex });

    const donorAddress = await lucid.wallet.address();

    // Create and sign the donation message
    const message = `Assign accumulated Scavenger rights to: ${recipientAddress}`;
    const payload = toHex(message);
    const signedMessage = await lucid.wallet.signMessage(donorAddress, payload);

    return {
      donorAddress,
      message,
      signature: signedMessage.signature,
    };
  } catch (error) {
    throw new Error(`Failed to derive/sign at index ${addressIndex}: ${error.message}`);
  }
}

/**
 * Phase 1: Generate all signatures
 */
async function generateSignatures(donors, recipientAddress) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Phase 1: Generating Signatures');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const signatureData = {
    recipientAddress,
    generatedAt: new Date().toISOString(),
    donors: [],
  };

  let totalAddresses = donors.reduce((sum, w) => sum + w.addressCount, 0);
  let processed = 0;

  for (let walletIdx = 0; walletIdx < donors.length; walletIdx++) {
    const wallet = donors[walletIdx];
    const walletName = wallet.name || `Wallet ${walletIdx + 1}`;

    console.log(`\n📍 Processing: ${walletName}`);
    console.log(`   Addresses to generate: ${wallet.addressCount}\n`);

    for (let addrIdx = 0; addrIdx < wallet.addressCount; addrIdx++) {
      try {
        // Derive address and sign message (public key not needed for /donate_to)
        const { donorAddress, message, signature } = await deriveAddressAndSign(
          wallet.seedPhrase,
          addrIdx,
          recipientAddress
        );

        signatureData.donors.push({
          walletName,
          addressIndex: addrIdx,
          donorAddress,
          message,
          signature,
          donated: false,
        });

        processed++;

        if (processed % 10 === 0 || processed === totalAddresses) {
          console.log(`   ✓ Generated ${processed}/${totalAddresses} signatures`);
        }
      } catch (error) {
        console.error(`   ✗ Error at index ${addrIdx}: ${error.message}`);
        signatureData.donors.push({
          walletName,
          addressIndex: addrIdx,
          error: error.message,
          donated: false,
        });
      }
    }
  }

  // Save signature file
  fs.writeFileSync(SIGNATURE_FILE, JSON.stringify(signatureData, null, 2), 'utf8');
  console.log(`\n✅ Signatures saved to: ${SIGNATURE_FILE}`);
  console.log(`   Total signatures generated: ${processed}/${totalAddresses}\n`);

  return signatureData;
}

/**
 * Execute a single donation via API
 */
async function executeDonation(recipientAddress, donor) {
  try {
    const donateUrl = `${API_BASE}/donate_to/${recipientAddress}/${donor.donorAddress}/${donor.signature}`;
    const response = await axios.post(donateUrl, {}, { timeout: 10000 });

    // Mark as successful
    donor.donated = true;
    donor.donationTime = new Date().toISOString();
    donor.apiResponse = response.data;
    donor.solutionsConsolidated = response.data.solutions_consolidated || response.data.Solutions_consolidated || 0;

    return { success: true, response: response.data };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error';

    // Check if error indicates already donated (treat as success)
    if (errorMsg.includes('already has an active donation assignment')) {
      donor.donated = true;
      donor.donationTime = new Date().toISOString();
      donor.apiResponse = { message: 'Already assigned (treated as success)', originalError: errorMsg };
      donor.solutionsConsolidated = 0;
      return { success: true, alreadyAssigned: true, response: errorMsg };
    }

    donor.error = errorMsg;
    donor.donated = false;
    return { success: false, error: errorMsg };
  }
}

/**
 * Phase 2: Execute API calls
 */
async function executeDonations(signatureData) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Phase 2: Executing Donations');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const pendingDonors = signatureData.donors.filter(d => !d.donated && !d.error && d.donorAddress);
  const alreadyDonated = signatureData.donors.filter(d => d.donated).length;

  console.log(`   Total donors: ${signatureData.donors.length}`);
  console.log(`   Already donated: ${alreadyDonated}`);
  console.log(`   Pending: ${pendingDonors.length}`);
  console.log(`   Recipient: ${signatureData.recipientAddress}\n`);

  if (pendingDonors.length === 0) {
    console.log('✅ All donations already completed!\n');
    return signatureData;
  }

  let successCount = 0;
  let failCount = 0;
  let alreadyAssignedCount = 0;

  for (let i = 0; i < pendingDonors.length; i++) {
    const donor = pendingDonors[i];

    console.log(`\n[${i + 1}/${pendingDonors.length}] Donating from: ${donor.donorAddress.substring(0, 20)}...`);

    const result = await executeDonation(signatureData.recipientAddress, donor);

    if (result.success) {
      if (result.alreadyAssigned) {
        alreadyAssignedCount++;
        console.log(`   ℹ️  Already assigned (treated as success)`);
      } else {
        successCount++;
        console.log(`   ✅ Success! Solutions consolidated: ${donor.solutionsConsolidated}`);
      }
    } else {
      failCount++;
      console.log(`   ✗ Failed: ${result.error}`);
    }

    // Save progress after each call
    fs.writeFileSync(SIGNATURE_FILE, JSON.stringify(signatureData, null, 2), 'utf8');

    // Rate limiting
    if (i < pendingDonors.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }

    // Progress update every 10 donations
    if ((i + 1) % 10 === 0) {
      console.log(`\n   📊 Progress: ${i + 1}/${pendingDonors.length} | Success: ${successCount} | Already Assigned: ${alreadyAssignedCount} | Failed: ${failCount}\n`);
    }
  }

  console.log(`\n✅ Donation phase completed:`);
  console.log(`   New donations: ${successCount}`);
  console.log(`   Already assigned: ${alreadyAssignedCount}`);
  console.log(`   Failed: ${failCount}\n`);

  return signatureData;
}

/**
 * Generate final results file
 */
function generateResults(signatureData) {
  const totalDonors = signatureData.donors.length;
  const successfulDonations = signatureData.donors.filter(d => d.donated).length;
  const failedDonations = signatureData.donors.filter(d => d.error && !d.donated).length;
  const totalSolutionsConsolidated = signatureData.donors.reduce((sum, d) => sum + (d.solutionsConsolidated || 0), 0);

  const results = {
    recipientAddress: signatureData.recipientAddress,
    totalDonors,
    successfulDonations,
    failedDonations,
    totalSolutionsConsolidated,
    completedAt: new Date().toISOString(),
    donors: signatureData.donors.map(d => ({
      walletName: d.walletName,
      addressIndex: d.addressIndex,
      donorAddress: d.donorAddress,
      donated: d.donated,
      donationTime: d.donationTime,
      solutionsConsolidated: d.solutionsConsolidated,
      error: d.error,
    })),
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf8');
  console.log(`💾 Final results saved to: ${OUTPUT_FILE}\n`);

  return results;
}

/**
 * Main function
 */
async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  Scavenger Mine - Allocation Consolidation Script');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Check for recipient address argument
    const recipientAddress = process.argv[2];
    if (!recipientAddress) {
      throw new Error(
        'Missing recipient address!\n' +
        'Usage: npm run donate <recipient_address>\n' +
        'Example: npm run donate addr1q8mamwlayr45guejvmzqt...'
      );
    }

    // Validate recipient address format
    if (!recipientAddress.startsWith('addr1')) {
      throw new Error(`Invalid Cardano address format: ${recipientAddress}`);
    }

    console.log(`📍 Recipient Address: ${recipientAddress}\n`);

    let signatureData;

    // Check if signature file exists
    if (fs.existsSync(SIGNATURE_FILE)) {
      signatureData = JSON.parse(fs.readFileSync(SIGNATURE_FILE, 'utf8'));

      // Verify recipient address matches
      if (signatureData.recipientAddress !== recipientAddress) {
        const answer = await askQuestion(
          `⚠️  Existing signature file has different recipient address:\n` +
          `   Existing: ${signatureData.recipientAddress}\n` +
          `   New: ${recipientAddress}\n` +
          `   Regenerate signatures? (yes/no): `
        );

        if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
          // Read input and regenerate
          const input = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
          const donors = input.donors || [];
          signatureData = await generateSignatures(donors, recipientAddress);
        } else {
          console.log('\n❌ Cancelled by user.\n');
          process.exit(0);
        }
      } else {
        console.log(`✅ Found existing signature file: ${SIGNATURE_FILE}`);
        const alreadyDonated = signatureData.donors.filter(d => d.donated).length;
        const pending = signatureData.donors.filter(d => !d.donated && !d.error && d.donorAddress).length;
        console.log(`   Total donors: ${signatureData.donors.length}`);
        console.log(`   Already donated: ${alreadyDonated}`);
        console.log(`   Pending: ${pending}\n`);
      }
    } else {
      // Read input file
      console.log(`📂 Reading input from: ${INPUT_FILE}`);

      if (!fs.existsSync(INPUT_FILE)) {
        throw new Error(
          `Input file not found: ${INPUT_FILE}\n` +
          `Please create wallet-donor-input.json.\n` +
          `See wallet-donor-input.sample.json for format.`
        );
      }

      const input = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
      const donors = input.donors || [];

      if (donors.length === 0) {
        throw new Error('No donors found in input file!');
      }

      // Validate donors
      for (let i = 0; i < donors.length; i++) {
        const donor = donors[i];
        if (!donor.seedPhrase) {
          throw new Error(`Donor ${i + 1}: Missing seedPhrase`);
        }
        if (!donor.addressCount || donor.addressCount < 1) {
          throw new Error(`Donor ${i + 1}: Missing or invalid addressCount`);
        }

        const words = donor.seedPhrase.trim().split(/\s+/);
        if (words.length !== 15 && words.length !== 24) {
          throw new Error(`Donor ${i + 1}: Invalid seed phrase (${words.length} words, must be 15 or 24)`);
        }
      }

      console.log(`✅ Loaded ${donors.length} donor wallet(s)\n`);

      // Generate signatures
      signatureData = await generateSignatures(donors, recipientAddress);
    }

    // Display summary and ask for confirmation
    const pending = signatureData.donors.filter(d => !d.donated && !d.error && d.donorAddress).length;

    if (pending > 0) {
      const answer = await askQuestion(
        `\n⚠️  Ready to execute ${pending} donation(s) to:\n` +
        `   ${recipientAddress}\n\n` +
        `   Please review ${SIGNATURE_FILE} before proceeding.\n` +
        `   Continue? (yes/no): `
      );

      if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
        console.log('\n❌ Cancelled by user.\n');
        process.exit(0);
      }
    }

    // Execute donations
    signatureData = await executeDonations(signatureData);

    // Generate final results
    const results = generateResults(signatureData);

    // Display summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  📊 Consolidation Summary');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Recipient Address:      ${results.recipientAddress}`);
    console.log(`  Total Donors:           ${results.totalDonors}`);
    console.log(`  ✅ Successful:          ${results.successfulDonations}`);
    console.log(`  ✗ Failed:               ${results.failedDonations}`);
    console.log(`  Solutions Consolidated: ${results.totalSolutionsConsolidated}`);
    console.log(`  Success Rate:           ${((results.successfulDonations / results.totalDonors) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════════════════════════');

    if (results.failedDonations > 0) {
      console.log('\n⚠️  Some donations failed. Check consolidation-results.json for details.');
      console.log('   You can re-run the script to retry failed donations.\n');
      process.exit(1);
    } else {
      console.log('\n🎉 All donations completed successfully!\n');
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
