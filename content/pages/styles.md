---
title: "Example CSS Variations Preview"
---

April⋅SSG provides a default CSS file in the `/template` folder for basic website styling. This sample page demonstrates several themes, each based on the default stylesheet with different color variations. Use the buttons below to preview each theme.

<div style="display:flex;flex-direction: row;flex-wrap: wrap;">
<style>
    .april-ssg-theme-demo-span{
        border:3px solid var(--border-color);
        border-radius:5px;
        padding:0.2em 1em;
        margin:5px;
        cursor:pointer;
    }
    .april-ssg-theme-demo-span:hover{
        text-decoration:underline;
    }
</style>
<span class="april-ssg-theme-demo-span" onClick="javascrip:document.getElementById('theme-css').href='/css-showcase/styles-red.css';">Red</span>
<span class="april-ssg-theme-demo-span" onClick="javascrip:document.getElementById('theme-css').href='/css-showcase/styles-green.css';">Green</span>
<span class="april-ssg-theme-demo-span" onClick="javascrip:document.getElementById('theme-css').href='/css-showcase/styles-blue.css';">Blue</span>
<span class="april-ssg-theme-demo-span" onClick="javascrip:document.getElementById('theme-css').href='/css-showcase/styles-pink.css';">Pink</span>
<span class="april-ssg-theme-demo-span" onClick="javascrip:document.getElementById('theme-css').href='/css/styles.css';">Default</span>
</div>

To apply your own styles, copy the default CSS file, modify it as needed, and update your `site.config.json` file to reference your custom stylesheet.

---

# The Quest for the Stardust Orchid

Welcome to "The Quest for the Stardust Orchid"! This narrative follows a daring crew on a mission to a newly discovered planet, Xylos, showcasing various Markdown elements.

## Prologue

The year is 2242. The starship *Odyssey* drifted silently through the void, its mission: to locate the mythical Stardust Orchid on the uncharted planet Xylos. Captain Eva Rostova, Navigator Jax, and Botanist Dr. Aris Thorne formed the core team.

### Mission Briefing

Before departure, the crew reviewed critical data from these interstellar databases:

- [Galactic Flora Database](https://example.com/galacticflora)
- [Xeno-Planetary Survey Archives](https://example.com/xpsa)
- [Starfarer's Navigation Guild](https://example.com/starnav)
- [Universal Xenolinguistics Institute](https://example.com/uxi)
- [Cosmic Cartographers Collective](https://example.com/ccc)

### Essential Gear

The success of their mission depended on their equipment:

- Advanced Exo-Suits
- Multi-Spectrum Scanners
- Botanical Sampling Kit
- Emergency Beacon
- The *Odyssey's* AI core, "Oracle"

#### The Anomaly

> "The universe is full of magical things patiently waiting for our wits to grow sharper."
> — Adapted from Eden Phillpotts

As they approached Xylos, Jax detected an unusual energy signature near the planet's southern pole, where the orchid was rumored to grow.

#### Planetary Scan Results

The initial scans of Xylos revealed a diverse but challenging environment:

| Feature         | Data                             | Risk Level |
|-----------------|----------------------------------|------------|
| Atmosphere      | Nitrogen-Oxygen, trace Xenon     | Low        |
| Gravity         | 0.9 G                            | Low        |
| Dominant Biome  | Bioluminescent Forest            | Medium     |
| Energy Signature| Unknown, concentrated at S. Pole | High       |
### The Descent

Captain Rostova initiated the landing sequence. "Oracle, run final diagnostics," she commanded. The ship's AI responded with a calm, synthesized voice.

```log
[2242-07-15 08:00:00] Landing sequence initiated.
[2242-07-15 08:00:05] All systems nominal.
[2242-07-15 08:00:10] Atmospheric entry angle: 27.5 degrees.
[2242-07-15 08:00:15] Heat shields at 15% capacity.
[2242-07-15 08:00:20] Thrusters adjusting for turbulence.
```
They used the `stabilize_descent()` protocol to ensure a smooth landing near the target zone. The protocol was implemented in C++ by the Odyssey's engineering team:

```cpp
// Odyssey Descent Stabilization Protocol
#include <iostream>
#include <cmath>

void stabilize_descent(double angle, double turbulence) {
    if (angle < 25.0 || angle > 30.0) {
        std::cout << "[Oracle] Warning: Entry angle out of optimal range.\n";
        angle = 27.5; // auto-correct to safe angle
    }
    if (turbulence > 0.7) {
        std::cout << "[Oracle] High turbulence detected. Engaging thruster compensation.\n";
    } else {
        std::cout << "[Oracle] Descent stable. Proceeding as planned.\n";
    }
}

int main() {
    double entry_angle = 27.5;
    double turbulence_level = 0.5; // 0 (calm) to 1 (severe)
    stabilize_descent(entry_angle, turbulence_level);
    return 0;
}
```

### First Steps on Xylos

The airlock hissed open, revealing a breathtaking landscape of glowing flora. Dr. Thorne was ecstatic. "Incredible! The biodiversity is beyond our projections."

They took a moment to capture the view:

![Xylos Bioluminescent Forest](/images/pexels-danila-popov-85164195-9007626.jpg "Green Fern Plant in Close Up Shot by Danila Popov on Pexels.com. Free to use.")
_Image: "Green Fern Plant in Close Up Shot" — free to use photo by Danila Popov on Pexels.com._

### The Search

The team ventured into the forest, their scanners active. They encountered strange, crystalline structures and docile, six-legged creatures. **Caution** was their watchword, as unknown dangers could lurk. _This planet is alive in ways we've never imagined_, Eva thought.

### Epilogue

After days of careful exploration, guided by the energy signature, they found it: the Stardust Orchid, its petals shimmering with captured starlight. Their mission was a success, promising new hope for interstellar medicine.

The journey back was filled with analysis and wonder. The Stardust Orchid was more than just a plant; it was a key to understanding life's tenacity across the cosmos.

Happy exploring!