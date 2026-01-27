let generator = null;

function initBioSynthUI() {
  generator = new BioSynthGenerator();

  const buttons = document.querySelectorAll("[data-sample]");
  if (!buttons.length) {
    console.warn("[BioSynth UI] No buttons found");
    return;
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const type = btn.dataset.sample;

      await generator.init();
      if (generator.audioContext.state === "suspended") {
        await generator.audioContext.resume();
      }

      const audio = generator.generateByType(type);
      if (!audio) return;

      generator.previewAudio(audio);

      const card = document.getElementById(`${type}-card`);
      if (card) card.classList.add("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", initBioSynthUI);

