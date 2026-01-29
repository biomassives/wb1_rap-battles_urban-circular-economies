import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './src/pages/docs';
const DONT_INDEX_FILE = '.dontindex';

// PROTECT YOUR ASSETS: Explicitly skip these high-volume or sensitive folders
const SYSTEM_IGNORE = [
  '.git', '.vercel', 'node_modules', 'public', 'src', 'dist', 
  'database', 'db', 'scripts', 'wav', 'js', 'styles'
];

function getBlacklist() {
  if (fs.existsSync(DONT_INDEX_FILE)) {
    return fs.readFileSync(DONT_INDEX_FILE, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  }
  return [];
}

const blacklist = getBlacklist();

function scanDir(dir, allFiles = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(process.cwd(), fullPath);

    // 1. Skip if folder/file is in SYSTEM_IGNORE or starts with a dot
    if (SYSTEM_IGNORE.includes(file) || file.startsWith('.')) return;
    
    // 2. Skip if file is in your custom .dontindex blacklist
    if (blacklist.includes(file)) return;

    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath, allFiles);
    } else if (file.endsWith('.md')) {
      allFiles.push(relPath);
    }
  });

  return allFiles.sort();
}

async function main() {
  console.log('🚀 Syncing root MD files to Astro docs...');
  
  const mdFiles = scanDir('.');
  
  if (fs.existsSync(OUTPUT_DIR)) fs.rmSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const manifest = [];

  mdFiles.forEach((file, index) => {
    const destPath = path.join(OUTPUT_DIR, file);
    const destDir = path.dirname(destPath);

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const originalContent = fs.readFileSync(file, 'utf-8');
    
    // Clean old frontmatter and inject DocLayout + Pagefind tagging
    const contentWithoutOldFrontmatter = originalContent.replace(/^---[\s\S]*?---/, '');
    const fileName = path.basename(file, '.md');
    
    const newContent = `---
layout: "../../layouts/DocLayout.astro"
title: "${fileName}"
---
<div data-pagefind-filter="type:docs"></div>

${contentWithoutOldFrontmatter}`;

    fs.writeFileSync(destPath, newContent);

    const url = '/docs/' + file.replace(/\.md$/, '').replace(/\\/g, '/');
    manifest.push({ title: fileName, url: url });
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, '_nav.json'), JSON.stringify(manifest, null, 2));
  console.log(`✅ Success: ${mdFiles.length} files mirrored to ${OUTPUT_DIR}`);
}

main();
