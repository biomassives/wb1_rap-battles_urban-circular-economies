#!/usr/bin/env node

/**
 * Sample Verification Script
 * Verifies all mixer samples are properly configured and exist
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wavDir = path.join(__dirname, '..', 'public', 'wav');
const banksFile = path.join(__dirname, '..', 'public', 'data', 'mixer-banks.json');

console.log('🔍 Verifying Mixer Sample Configuration\n');

// Check if wav directory exists
if (!fs.existsSync(wavDir)) {
  console.error('❌ WAV directory not found:', wavDir);
  process.exit(1);
}

// Check if banks file exists
if (!fs.existsSync(banksFile)) {
  console.error('❌ Mixer banks file not found:', banksFile);
  process.exit(1);
}

// Read mixer banks
const banks = JSON.parse(fs.readFileSync(banksFile, 'utf-8'));

console.log('📦 LEFT BANK:', banks.leftBank.name);
console.log('─'.repeat(50));

let leftMissing = 0;
let leftTotal = 0;

banks.leftBank.samples.forEach((sample, idx) => {
  leftTotal++;

  // Extract sample name from pattern
  const match = sample.pattern.match(/s\("([^"]+)"\)|sound\("([^"]+)"\)/);
  const sampleName = match ? (match[1] || match[2]) : null;

  if (!sampleName) {
    console.log(`${idx + 1}. ❌ ${sample.name} - Invalid pattern: ${sample.pattern}`);
    leftMissing++;
    return;
  }

  // Check if sample is a single sound or pattern
  const sounds = sampleName.split(/[\s,]+/);
  const firstSound = sounds[0];

  const wavFile = path.join(wavDir, `${firstSound}.wav`);
  const exists = fs.existsSync(wavFile);

  if (exists) {
    const stats = fs.statSync(wavFile);
    const size = (stats.size / 1024).toFixed(1);
    console.log(`${idx + 1}. ✅ ${sample.name.padEnd(15)} → ${firstSound.padEnd(15)} (${size} KB)`);
  } else {
    console.log(`${idx + 1}. ❌ ${sample.name.padEnd(15)} → ${firstSound}.wav NOT FOUND`);
    leftMissing++;
  }
});

console.log('\n📦 RIGHT BANK:', banks.rightBank.name);
console.log('─'.repeat(50));

let rightMissing = 0;
let rightTotal = 0;

banks.rightBank.samples.forEach((sample, idx) => {
  rightTotal++;

  // Extract sample name from pattern
  const match = sample.pattern.match(/s\("([^"]+)"\)|sound\("([^"]+)"\)/);
  const sampleName = match ? (match[1] || match[2]) : null;

  if (!sampleName) {
    console.log(`${idx + 1}. ❌ ${sample.name} - Invalid pattern: ${sample.pattern}`);
    rightMissing++;
    return;
  }

  // Check if sample is a single sound or pattern
  const sounds = sampleName.split(/[\s,]+/);
  const firstSound = sounds[0];

  const wavFile = path.join(wavDir, `${firstSound}.wav`);
  const exists = fs.existsSync(wavFile);

  if (exists) {
    const stats = fs.statSync(wavFile);
    const size = (stats.size / 1024).toFixed(1);
    console.log(`${idx + 1}. ✅ ${sample.name.padEnd(15)} → ${firstSound.padEnd(15)} (${size} KB)`);
  } else {
    console.log(`${idx + 1}. ❌ ${sample.name.padEnd(15)} → ${firstSound}.wav NOT FOUND`);
    rightMissing++;
  }
});

// Summary
console.log('\n' + '═'.repeat(50));
console.log('SUMMARY');
console.log('═'.repeat(50));

const totalSamples = leftTotal + rightTotal;
const totalMissing = leftMissing + rightMissing;
const totalFound = totalSamples - totalMissing;

console.log(`Left Bank:  ${leftTotal - leftMissing}/${leftTotal} samples found`);
console.log(`Right Bank: ${rightTotal - rightMissing}/${rightTotal} samples found`);
console.log(`Total:      ${totalFound}/${totalSamples} samples found`);

if (totalMissing === 0) {
  console.log('\n✅ All samples verified! Mixer is ready to use.');
  process.exit(0);
} else {
  console.log(`\n❌ ${totalMissing} sample(s) missing. Run: npm run generate-all-samples`);
  process.exit(1);
}
