window.wbWeb3 = {
    state: {
        address: null,
        network: null,
        unlockedModalities: []
    },

    async init() {
        this.scanLocal();
        this.updateUI();
    },

    scanLocal() {
        // Scans LocalStorage for your Binder Literacy Cert
        const cert = localStorage.getItem('cert_binder');
        if (cert) {
            this.state.unlockedModalities.push({
                id: 'binder',
                icon: '📓',
                title: 'BINDER_LITERACY'
            });
        }
    },

    async connectSolana() {
        if ("solana" in window) {
            const resp = await window.solana.connect();
            this.state.address = resp.publicKey.toString();
            this.state.network = 'SOLANA_DEVNET';
            window.wbToast?.("SOLANA_ANCHOR_SUCCESS", 50);
            this.updateUI();
        }
    },

    updateUI() {
        const addrDisplay = document.getElementById('profile-wallet-display');
        if (this.state.address) {
            addrDisplay.textContent = `${this.state.address.slice(0, 8)}...${this.state.address.slice(-4)}`;
            addrDisplay.style.color = "#b4f55b";
        }

        const grid = document.getElementById('owned-nfts-grid');
        if (this.state.unlockedModalities.length > 0) {
            grid.innerHTML = this.state.unlockedModalities.map(m => `
                <div class="nft-card minted-local">
                    <div class="nft-emoji">${m.icon}</div>
                    <h4>${m.title}</h4>
                    <p class="rarity">STATUS: VERIFIED_LOCAL</p>
                    <a href="/certification" class="btn-secondary small">VIEW_CARD</a>
                </div>
            `).join('');
        }
    }
};

// Start logic
document.addEventListener('DOMContentLoaded', () => window.wbWeb3.init());

window.wbNode = {
    active: false,
    
    async toggleNode() {
        const btn = event.target;
        const status = document.getElementById('node-state');
        const indicator = document.getElementById('node-indicator');

        if (!this.active) {
            btn.textContent = "INITIALIZING_RUST_WASM...";
            
            // Simulate loading the Rust-compiled E8 Lattice engine
            setTimeout(() => {
                this.active = true;
                btn.textContent = "TERMINATE_NODE";
                status.textContent = "RUNNING_VALIDATOR";
                indicator.classList.add('active');
                window.wbToast?.("E8_NODE_ACTIVE: SYNCHRONIZING_LATTICE", 100);
                this.startHeartbeat();
            }, 2000);
        } else {
            this.active = false;
            btn.textContent = "BOOT_VALIDATOR_NODE";
            status.textContent = "INACTIVE";
            indicator.classList.remove('active');
        }
    },

    startHeartbeat() {
        if (!this.active) return;
        // Simulate oracle validation pulses
        console.log("E8 Lattice Pulse: Validating Biodiversity Stream...");
        setTimeout(() => this.startHeartbeat(), 5000);
    }
};

// Add Minting functions to window.wbWeb3
window.wbWeb3.mintSolana = async function() {
    if (!this.state.address) return alert("CONNECT_WALLET_FIRST");
    window.wbToast?.("MINTING_TO_SOLANA: SIGN_TRANSACTION_NOW", 0);
    // Here you would call your specific Solana Program (Smart Contract)
};










// Global Tab Switcher
window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).style.display = 'block';
    event.target.classList.add('active');
};
