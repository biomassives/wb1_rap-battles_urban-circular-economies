// /scripts/airdrop_logic.js

const WB1_AIRDROP_CONFIG = {
  vercelApi: 'https://wb1-api.vercel.app/api/check-drop',
  localMetadata: '/data/metadata_bootstrap.json'
};

async function initAirdropSequence() {
  // 1. Pre-populate from JSON
  const response = await fetch(WB1_AIRDROP_CONFIG.localMetadata);
  const baseData = await response.json();
  localStorage.setItem('wb1_meta_cache', JSON.stringify(baseData));

  renderMetadata(baseData);

  // 2. Check Intersectional Schedule via Vercel
  const status = await fetch(`${WB1_AIRDROP_CONFIG.vercelApi}?wallet=${window.wbWeb3.state.address}`);
  const schedule = await status.json();

  if (schedule.is_ready && window.wbNode.active) {
    document.getElementById('claim-btn').disabled = false;
    document.getElementById('sequence-intel').textContent = "LATTICE_ALIGNMENT_READY_FOR_EXTRACTION";
  }
}

function renderMetadata(data) {
  const container = document.getElementById('nft-metadata-display');
  container.innerHTML = data.traits.map(t => `
    <div class="log-entry">
      [DIM_${t.dimension}]: ${t.value} >> ${t.status}
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', initAirdropSequence);
