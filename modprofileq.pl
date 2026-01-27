#!/usr/bin/perl
use strict;
use warnings;

my $input_file = 'src/pages/profile.astro';
my $output_file = 'src/pages/profile_activityfeed.astro';

open(my $fh, '<', $input_file) or die "Could not open '$input_file' $!";
my $content = do { local $/; <$fh> };
close($fh);

# --- The Feed HTML ---
my $feed_html = <<'HTML';
<section id="transparency-feed" class="profile-section mt-12 border-t pt-8 px-4">
  <div class="max-w-4xl mx-auto">
    <h3 class="text-2xl font-bold text-green-800 mb-6 flex items-center gap-2">
      🌱 Global Impact Feed
    </h3>
    <ul id="activity-list" class="space-y-3">
      <li class="p-4 bg-gray-50 rounded-lg animate-pulse text-gray-400">
        Fetching biodiversity ledger facts...
      </li>
    </ul>
  </div>
</section>
HTML

# --- The Vanilla JS Logic ---
my $feed_js = <<'JS';
<script is:inline>
  async function loadGlobalFeed() {
    const list = document.getElementById('activity-list');
    try {
      const res = await fetch('/api/environmental/global-feed');
      const json = await res.json();

      if (!json.data || json.data.length === 0) {
        list.innerHTML = '<li class="p-4 text-gray-500">The ledger is quiet. No observations yet.</li>';
        return;
      }

      list.innerHTML = json.data.map(event => {
        const wallet = `${event.wallet_address.slice(0, 6)}...${event.wallet_address.slice(-4)}`;
        const time = new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let msg = event.event_type === 'observation_submitted' 
          ? `recorded a <strong>biodiversity observation</strong>` 
          : `contributed to the network`;

        return `
          <li class="flex items-center justify-between p-4 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3">
              <span class="text-xs font-mono bg-green-50 text-green-700 px-2 py-1 rounded">${time}</span>
              <span class="text-sm"><code class="text-blue-600 font-bold">${wallet}</code> ${msg}</span>
            </div>
            <span class="text-xs text-gray-400 italic">${event.payload.location || ''}</span>
          </li>
        `;
      }).join('');
    } catch (e) {
      list.innerHTML = '<li class="p-4 text-red-400">Feed temporarily unavailable.</li>';
    }
  }
  loadGlobalFeed();
</script>
JS

# --- Smart Injection Logic ---
# Try to inject before the closing tag of the main layout/container
if ($content =~ s/(<\/Layout>)/$feed_html\n$1/) {
    print "✅ Found </Layout>, injected feed inside layout.\n";
} elsif ($content =~ s/(<\/main>)/$feed_html\n$1/) {
    print "✅ Found </main>, injected feed before main end.\n";
} elsif ($content =~ s/(<\/div>\s*)$/$feed_html\n$1/m) {
    print "✅ Found trailing </div>, injected feed before final div.\n";
} else {
    $content .= "\n$feed_html";
    print "⚠️ No anchor found, appended to bottom.\n";
}

$content .= "\n$feed_js";

open(my $out, '>', $output_file) or die "Could not open '$output_file' $!";
print $out $content;
close($out);
print "🚀 Created $output_file\n";
