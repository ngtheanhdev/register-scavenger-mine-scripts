import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, 'registration-results.json');
const OUTPUT_FILE = path.join(__dirname, 'wallets.txt');

try {
  console.log('\n📂 Reading registration-results.json...');

  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error('registration-results.json not found! Please run registration first.');
  }

  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

  // Extract all successfully registered addresses
  const addresses = [];

  if (data.wallets && Array.isArray(data.wallets)) {
    for (const wallet of data.wallets) {
      if (wallet.addresses && Array.isArray(wallet.addresses)) {
        for (const addr of wallet.addresses) {
          if (addr.registered && addr.bech32) {
            addresses.push(addr.bech32);
          }
        }
      }
    }
  }

  if (addresses.length === 0) {
    throw new Error('No successfully registered addresses found!');
  }

  // Write to wallets.txt (one address per line)
  const content = addresses.join('\n') + '\n';
  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');

  console.log(`✅ Exported ${addresses.length} addresses to wallets.txt\n`);
  console.log('📄 File: ' + OUTPUT_FILE);
  console.log('');

} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
