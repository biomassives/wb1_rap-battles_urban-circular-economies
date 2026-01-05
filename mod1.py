import os

def enhance_visual_impact():
    file_path = 'src/pages/leaderboard.astro'
    if not os.path.exists(file_path): return

    with open(file_path, 'r') as f:
        content = f.read()

    # 1. High-Contrast Arcade Table Styles
    table_css = """
<style>
  .leaderboard-table {
    border: 4px solid var(--color-ska-black);
    background: var(--color-ska-white);
  }
  
  .leaderboard-table thead th {
    background: var(--color-ska-black);
    color: var(--color-invader-green);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-family: monospace;
    border-bottom: 4px solid var(--color-invader-pink);
  }

  .leaderboard-row:nth-child(even) {
    background: #f0f0f0; /* Subtle contrast for scan-line feel */
  }

  /* The "Important Point" Chart Styles */
  .impact-chart-container {
    background: var(--color-ska-black);
    color: var(--color-ska-white);
    padding: 2rem;
    border: 10px double var(--color-ska-white);
    margin: 4rem 0;
  }

  .bar-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;
  }

  .bar-label { width: 150px; font-family: monospace; font-size: 0.8rem; }
  .bar-track { flex-grow: 1; height: 24px; background: #333; position: relative; }
  .bar-fill { height: 100%; background: var(--color-invader-green); transition: width 1s ease-out; }
  .bar-value { padding-left: 10px; font-weight: bold; color: var(--color-invader-pink); }
</style>
"""

    # 2. The "Important Point" Chart HTML
    impact_chart_html = """
      <div class="impact-chart-container">
        <h2 class="text-center mb-6" style="color: var(--color-invader-green)">👾 SYSTEM IMPACT: VERIFIED OBSERVATIONS</h2>
        <p class="text-center mb-8 text-sm">Transparency levels directly correlate to ecosystem funding.</p>
        
        <div class="bar-wrapper">
          <div class="bar-label">PRIVATE DATA</div>
          <div class="bar-track"><div class="bar-fill" style="width: 25%"></div></div>
          <div class="bar-value">25% Trust</div>
        </div>
        
        <div class="bar-wrapper">
          <div class="bar-label">API-ONLY</div>
          <div class="bar-track"><div class="bar-fill" style="width: 55%"></div></div>
          <div class="bar-value">55% Trust</div>
        </div>

        <div class="bar-wrapper">
          <div class="bar-label">ON-CHAIN + PG</div>
          <div class="bar-track" style="border: 2px solid var(--color-invader-pink)">
            <div class="bar-fill" style="width: 98%; background: var(--color-invader-pink)"></div>
          </div>
          <div class="bar-value">98% TRUST</div>
        </div>
        <p class="mt-6 text-xs text-center opacity-70">Calculated by cross-referencing Kakuma Youth field observations with decentralized validator nodes.</p>
      </div>
    """

    content = content.replace("<style>", table_css + "\n<style>")
    content = content.replace("\n  ", 
                             impact_chart_html + "\n  ")

    with open('src/pages/leaderboard.v2.astro', 'w') as f:
        f.write(content)

if __name__ == "__main__":
    enhance_visual_impact()
