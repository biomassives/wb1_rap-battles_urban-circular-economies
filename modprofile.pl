#!/usr/bin/perl
use strict;
use warnings;

my $input_file = 'src/pages/profile.astro';
my $output_file = 'src/pages/profile_activityfeed.astro';

# Read the entire content of the existing profile
open(my $fh, '<', $input_file) or die "Could not open '$input_file' $!";
my $content = do { local $/; <$fh> };
close($fh);

# 1. Define the HTML for the Transparency Feed
my $feed_html = <<'HTML';
  <section id="transparency-feed" class="mt-8 border-t pt-6">
    <h3 class="text-xl font-bold mb-4">Global Impact Feed</h3>
    <ul id="activity-list" class="space-y-2">
      <li class="text-gray-500 italic">Loading latest biodiversity activity...</li>
    </ul>
  </section>
HTML

# 2. Define the Vanilla JS Logic
my $feed_js = <<'JS';
<script is:inline>
  async function loadGlobalFeed() {
    const listElement = document.getElementById('activity-list');
    try {
      const response = await fetch('/api/environmental/global-feed');
      const { data } = await response.json();

      if (!data || data.length === 0) {
        listElement.innerHTML = '<li>No activity recorded yet.</li>';
        return;
      }

      listElement.innerHTML = data.map(event => {
        const shortWallet = `${event.wallet_address.slice(0, 6)}...${event.wallet_address.slice(-4)}`;
        const date = new Date(event.created_at).toLocaleTimeString();
        let message = '';
        
        if (event.event_type === 'observation_submitted') {
          message = `submitted a new observation in <strong>${event.payload.location || 'Unknown'}</strong>`;
        } else {
          message = `contributed to the biodiversity ledger`;
        }

        return `
          <li class="p-3 bg-gray-50 rounded border border-gray-200 flex gap-3 text-sm">
            <span class="text-gray-400">[${date}]</span>
            <code class="font-mono text-blue-600">${shortWallet}</code> 
            <span>${message}</span>
          </li>
        `;
      }).join('');
    } catch (err) {
      listElement.innerHTML = '<li class="text-red-500">Error loading feed.</li>';
    }
  }
  loadGlobalFeed();
</script>
JS

# 3. Modification Logic
# We'll look for the end of the main container (often a closing </main> or </div>)
# Adjust the regex if your profile.astro uses a different main wrapper.
if ($content =~ s/(<\/main>)/$feed_html\n$1/) {
    print "Successfully inserted HTML feed before </main>\n";
} else {
    # Fallback: append to the end if no </main> found
    $content .= "\n$feed_html";
    print "Could not find </main>, appended feed to end of file.\n";
}

# Append the script at the very end
$content .= "\n$feed_js";

# 4. Write the new file
open(my $out, '>', $output_file) or die "Could not open '$output_file' $!";
print $out $content;
close($out);

print "DONE: Created $output_file\n";
