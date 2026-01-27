#!/usr/bin/perl
use strict;
use warnings;

my $input_file = 'src/pages/battle-recorder.astro';
my $output_file = 'src/pages/rap-battle-nft-v110.astro';

open(my $fh, '<', $input_file) or die "Could not open $input_file: $!";
my $content = do { local $/; <$fh> };
close($fh);

# 1. Update the Title and Heading
$content =~ s/Recorder → NFT Prototype/Bio-Acoustic Rap Battle v1.1.0/g;
$content =~ s/👾 RECORDER → NFT PROTOTYPE 👾/🌿 BIO-ACOUSTIC BATTLE v1.1.0 🌿/g;

# 2. Inject the new Library Script tag

my $new_scripts = <<'HTML';
<script src="https://unpkg.com/\@strudel/web@1.0.3"></script>
<script src="/scripts/nft-strudel-player.js"></script>
HTML

# 3. Update the Metadata Builder to include 'staged' status and Object IDs
my $new_metadata_logic = <<'JS';
function buildMetadata() {
  const objectID = activeObjectID || 'ambient';
  return {
    name: document.getElementById('mint-name').value || 'New Observation',
    status: 'staged',
    category: activeDomain,
    objectID: objectID,
    description: document.getElementById('mint-description').value,
    metadata: {
      strudelPattern: `s("${objectID}").gain(1)`,
      attributes: [
        { trait_type: 'Domain', value: activeDomain },
        { trait_type: 'Object', value: objectID },
        { trait_type: 'Standard', value: 'v1.1.0-Bio' }
      ]
    }
  };
}
JS
$content =~ s/function buildMetadata\(\) \{.*?^\}/$new_metadata_logic/ms;

# 4. Swap the "Pack NFT" handler to use window.nftStrudelPlayer and localDB
my $new_pack_logic = <<'JS';
document.getElementById('mint-pack').onclick = async () => {
  const metadata = buildMetadata();
  const nftId = `bio-${Date.now()}`;
  
  const packed = {
    id: nftId,
    ...metadata,
    blob: recordedBlob, // The actual vocal take
    packedAt: new Date().toISOString()
  };

  // Use the new shared library to save to IndexedDB
  if (window.nftStrudelPlayer) {
    const db = await window.nftStrudelPlayer.getDB();
    const tx = db.transaction(['nfts'], 'readwrite');
    tx.objectStore('nfts').add(packed);
    
    tx.oncomplete = () => {
      document.getElementById('mint-output').textContent = "✅ STAGED IN LOCAL DB: " + nftId;
      console.log('Bio-NFT Staged for Minting Page', packed);
    };
  }
};
JS
$content =~ s/document\.getElementById\('mint-pack'\)\.onclick = async \(\) => \{.*?^\};/$new_pack_logic/ms;

# Write the new file
open(my $out, '>', $output_file) or die "Could not open $output_file: $!";
print $out $content;
close($out);

print "Successfully produced $output_file\n";
