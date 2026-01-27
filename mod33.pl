#!/usr/bin/perl
use strict;
use warnings;

my $input_file = 'src/pages/record-nft-simple.astro';
my $output_file = 'src/pages/record-nft-simple-v110.astro';

open(my $fh, '<', $input_file) or die "Could not open $input_file: $!";
my $content = do { local $/; <$fh> };
close($fh);

# 1. Update Title
$content =~ s/Recorder → NFT Prototype/Bio-Acoustic Rap Battle v1.1.0/g;

# 2. Inject Song Gallery UI
my $song_gallery_ui = <<'HTML';
<section class="panel">
  <h2>1 ▸ Pick a Strudel Beat</h2>
  <div class="song-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
    <button class="song-pick" data-id="techno">🕹️ Techno</button>
    <button class="song-pick" data-id="lofi">☕ Lofi</button>
    <button class="song-pick" data-id="jungle">🌴 Jungle</button>
  </div>
  
  <div class="live-code-container">
    <h4 style="color: var(--neon-cyan); font-size: 0.7rem; margin-bottom: 5px;">LIVE STRUDEL CODE</h4>
    <pre id="live-code-display" style="border-color: var(--neon-cyan); min-height: 100px; color: #00e5ff;">// Select a beat to see the code...</pre>
  </div>
</section>
HTML

# Replace the old backing track section
$content =~ s/<section class="panel">.*?<\/section>/$song_gallery_ui/s;

# 3. Inject Song Definitions and Selection Logic
my $js_logic = <<'JS';
const songLibrary = {
    techno: 's("bd*4, [~ sd]*2, [hh*4]*2").gain(0.7)',
    lofi: 's("bd [~ sd] bd sd").bank("dr55").delay(0.4).room(0.5)',
    jungle: 's("bd [~ sd] [~ bd] sd").speed(1.5).chop(8).room(0.2)'
};

let currentBaseCode = '';

document.querySelectorAll('.song-pick').forEach(btn => {
    btn.onclick = () => {
        const songId = btn.dataset.id;
        currentBaseCode = songLibrary[songId];
        
        // Update Display
        document.getElementById('live-code-display').innerText = currentBaseCode;
        
        // Play immediately
        if (typeof hush === 'function') hush();
        eval(`${currentBaseCode}.play()`);
        
        // Highlight active
        document.querySelectorAll('.song-pick').forEach(b => b.style.background = 'transparent');
        btn.style.background = 'rgba(0, 229, 255, 0.2)';
    };
});

document.getElementById('preview-remix').onclick = async () => {
    if (!recordedBlob) return alert("Record your bio-sample overlay first!");
    
    const previewUrl = URL.createObjectURL(recordedBlob);
    const sampleOverlay = `s("bio").every(2, rev).room(0.5)`;
    
    // Update the Live Code View to show the Overlay
    const fullCode = `stack(\n  ${currentBaseCode},\n  ${sampleOverlay}\n)`;
    document.getElementById('live-code-display').innerText = fullCode;

    if (typeof hush === 'function') hush();
    eval(`
        samples({ "bio": "${previewUrl}" });
        ${fullCode}.play();
    `);
};
JS

$content =~ s/<\/script>/$js_logic\n<\/script>/;

open(my $out, '>', $output_file) or die "Could not open $output_file: $!";
print $out $content;
close($out);
print "v1.1.0 Produced with Song Gallery and Live Code View.\n";
