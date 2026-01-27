#!/usr/bin/perl
use strict;
use warnings;

my $input_file = 'src/pages/battle-recorder.astro';
my $output_file = 'src/pages/rap-battle-nft-v110.astro';

# Read input
open(my $fh, '<', $input_file) or die "Could not open $input_file: $!";
my $content = do { local $/; <$fh> };
close($fh);

# 1. Update Title/Headers
$content =~ s/Recorder → NFT Prototype/Bio-Acoustic Rap Battle v1.1.0/g;
$content =~ s/👾 RECORDER → NFT PROTOTYPE 👾/🌿 BIO-ACOUSTIC BATTLE v1.1.0 🌿/g;

# 2. Inject Scripts (Fixed the @ issue by using single-quoted heredoc)
my $new_scripts = <<'HTML';
<script src="https://unpkg.com/@strudel/web@1.0.3"></script>
<script src="/scripts/nft-strudel-player.js"></script>
HTML

$content =~ s/<script src="https:\/\/unpkg\.com\/@strudel\/web\@1\.0\.3"><\/script>/$new_scripts/;

# 3. Inject Metadata Logic
my $new_metadata_logic = <<'JS';
function buildMetadata() {
  const objectID = typeof activeObjectID !== 'undefined' ? activeObjectID : 'ambient';
  const domain = typeof activeDomain !== 'undefined' ? activeDomain : 'general';
  return {
    name: document.getElementById('mint-name').value || 'New Observation',
    status: 'staged',
    category: domain,
    objectID: objectID,
    description: document.getElementById('mint-description').value,
    metadata: {
      strudelPattern: `s("${objectID}").gain(1)`,
      attributes: [
        { trait_type: 'Domain', value: domain },
        { trait_type: 'Object', value: objectID }
      ]
    }
  };
}
JS
$content =~ s/function buildMetadata\(\) \{.*?^\}/$new_metadata_logic/ms;

# 4. Inject Packing Logic
my $new_pack_logic = <<'JS';
document.getElementById('mint-pack').onclick = async () => {
  const metadata = buildMetadata();
  const nftId = `bio-${Date.now()}`;
  
  const packed = {
    id: nftId,
    ...metadata,
    blob: recordedBlob, 
    packedAt: new Date().toISOString()
  };

  if (window.nftStrudelPlayer) {
    try {
        const db = await window.nftStrudelPlayer.getDB();
        const tx = db.transaction(['nfts'], 'readwrite');
        tx.objectStore('nfts').add(packed);
        tx.oncomplete = () => {
          document.getElementById('mint-output').textContent = "✅ STAGED IN LOCAL DB: " + nftId;
        };
    } catch (e) {
        console.error("DB Error:", e);
    }
  }
};
JS
$content =~ s/document\.getElementById\('mint-pack'\)\.onclick = async \(\) => \{.*?^\};/$new_pack_logic/ms;

# Write output
open(my $out, '>', $output_file) or die "Could not open $output_file: $!";
print $out $content;
close($out);

print "Successfully generated $output_file\n";
