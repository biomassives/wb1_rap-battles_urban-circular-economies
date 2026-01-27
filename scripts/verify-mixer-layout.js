#!/usr/bin/env node

/**
 * Mixer Layout Verification
 * Verifies the 9+9 pad layout is correct
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const presetsFile = path.join(__dirname, '..', 'public', 'data', 'mixer-bank-presets.json');

console.log('🎛️  Verifying Mixer 9+9 Pad Layout\n');

// Load presets
const presets = JSON.parse(fs.readFileSync(presetsFile, 'utf-8')).presets;

console.log(`Found ${presets.length} presets\n`);

presets.forEach((preset, idx) => {
  console.log(`${'═'.repeat(60)}`);
  console.log(`PRESET ${idx + 1}: ${preset.id}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`Description: ${preset.description}`);
  console.log();

  // Left Bank
  console.log(`LEFT BANK: "${preset.leftBankName}"`);
  console.log('─'.repeat(60));

  const leftGrid = [
    preset.leftBank.slice(0, 3),
    preset.leftBank.slice(3, 6),
    preset.leftBank.slice(6, 9)
  ];

  leftGrid.forEach((row, rowIdx) => {
    const line = row.map(sample =>
      `[${sample.id}] ${sample.name.padEnd(12)} ${sample.type.padEnd(7)}`
    ).join(' ');
    console.log(`Row ${rowIdx + 1}: ${line}`);
  });

  console.log();
  console.log(`✅ Left Bank: ${preset.leftBank.length} pads (3×3 grid)`);
  console.log();

  // Right Bank
  console.log(`RIGHT BANK: "${preset.rightBankName}"`);
  console.log('─'.repeat(60));

  const rightGrid = [
    preset.rightBank.slice(0, 3),
    preset.rightBank.slice(3, 6),
    preset.rightBank.slice(6, 9)
  ];

  rightGrid.forEach((row, rowIdx) => {
    const line = row.map(sample =>
      `[${sample.id}] ${sample.name.padEnd(12)} ${sample.type.padEnd(7)}`
    ).join(' ');
    console.log(`Row ${rowIdx + 1}: ${line}`);
  });

  console.log();
  console.log(`✅ Right Bank: ${preset.rightBank.length} pads (3×3 grid)`);
  console.log();
});

console.log(`${'═'.repeat(60)}`);
console.log('SUMMARY');
console.log(`${'═'.repeat(60)}`);

const allValid = presets.every(p =>
  p.leftBank.length === 9 && p.rightBank.length === 9
);

if (allValid) {
  console.log('✅ All presets have exactly 9 pads per bank');
  console.log('✅ Total: 18 playable pads per preset (9+9)');
  console.log('✅ Layout: 3×3 grid on each side');
  console.log();
  console.log('🎵 Mixer is ready with proper 9+9 pad layout!');
  process.exit(0);
} else {
  console.log('❌ Some presets have incorrect pad counts');
  process.exit(1);
}
