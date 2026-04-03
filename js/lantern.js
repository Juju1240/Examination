// Ornate Triple-Head Street Lamp Component — FULLY FIXED & ENHANCED
AFRAME.registerComponent('street-lamp', {
  schema: {
    position: { type: 'vec3', default: { x: 0, y: 0, z: 0 } },
    scale: { type: 'number', default: 1.0 }
  },

  init: function () {
    const el = document.createElement('a-entity');
    el.setAttribute('position', this.data.position);
    el.setAttribute('scale', `${this.data.scale} ${this.data.scale} ${this.data.scale}`);

    const mats = {
      iron: 'color: #1a1c1a; roughness: 0.9; metalness: 0.4',
      glassGlow: 'color: #ffebb5; emissive: #ffb84d; emissiveIntensity: 1.2; roughness: 0.3',
      lightColor: '#ffb84d'
    };

    let html = '';

    // ==========================================
    // 1. HEAVY CAST IRON BASE & POLE
    // ==========================================

    // Tiered Base Plinth
    // Layer 1: bottom disc, centre at y=0.05 (half of h=0.1)
    html += `<a-cylinder position="0 0.05 0" radius="0.35" height="0.1" material="${mats.iron}"></a-cylinder>`;
    // Layer 2: sits on top of layer 1 → base at 0.1, centre at 0.1+0.05 = 0.15
    html += `<a-cylinder position="0 0.15 0" radius="0.30" height="0.1" material="${mats.iron}"></a-cylinder>`;
    // Cone: base at top of layer 2 (y=0.2), height=0.6, centre at 0.2+0.3 = 0.5
    html += `<a-cone position="0 0.5 0" radius-bottom="0.28" radius-top="0.08" height="0.6" material="${mats.iron}"></a-cone>`;

    // Decorative rings — cone top is at y = 0.2 + 0.6 = 0.8
    html += `<a-torus position="0 0.8 0" radius="0.09" radius-tubular="0.02" rotation="90 0 0" material="${mats.iron}"></a-torus>`;
    // Collar ring sits just above torus: y=0.8+0.025=0.825, use 0.83 centre
    html += `<a-cylinder position="0 0.83 0" radius="0.1" height="0.05" material="${mats.iron}"></a-cylinder>`;

    // Main central shaft: base at y=0.855, height=2.6 → centre at 0.855+1.3=2.155
    html += `<a-cylinder position="0 2.155 0" radius="0.045" height="2.6" material="${mats.iron}"></a-cylinder>`;

    // Center Hub: shaft top = 0.855+2.6 = 3.455 ≈ 3.45
    // Hub height=0.4 → centre at 3.45+0.2 = 3.65
    html += `<a-cylinder position="0 3.65 0" radius="0.08" height="0.4" material="${mats.iron}"></a-cylinder>`;
    // Decorative torus rings at hub bottom and top
    html += `<a-torus position="0 3.45 0" radius="0.09" radius-tubular="0.015" rotation="90 0 0" material="${mats.iron}"></a-torus>`;
    html += `<a-torus position="0 3.85 0" radius="0.09" radius-tubular="0.015" rotation="90 0 0" material="${mats.iron}"></a-torus>`;


    // ==========================================
    // 2. ORNATE WROUGHT-IRON ARMS
    // ==========================================

    // Main horizontal crossbar — at mid-hub height = 3.65
    html += `<a-cylinder position="0 3.65 0" radius="0.025" height="1.6" rotation="0 0 90" material="${mats.iron}"></a-cylinder>`;

    // Vertical drop supports for side lanterns:
    // Crossbar ends at x=±0.8. Support drops DOWN from crossbar level.
    // We want the lantern fitting to sit at the support bottom.
    // Support height=0.2, centre at 3.65+0.1=3.75 (drops down from crossbar to 3.65+0.2=3.85... 
    // Actually for a "drop" we go BELOW: 3.65-0.1=3.55 centre → bottom at 3.45)
    // Let's make it a neat upward stub that the lantern hangs from: centre at 3.65+0.1=3.75, bottom 3.65, top 3.85
    html += `<a-cylinder position="-0.8 3.75 0" radius="0.025" height="0.2" material="${mats.iron}"></a-cylinder>`;
    html += `<a-cylinder position="0.8 3.75 0" radius="0.025" height="0.2" material="${mats.iron}"></a-cylinder>`;

    // Procedural Scrollwork (S-curves using toruses)
    // Left side: swirl below the left crossbar end
    html += `<a-torus position="-0.4 3.45 0" radius="0.2" radius-tubular="0.015" arc="180" rotation="0 0 0" material="${mats.iron}"></a-torus>`;
    html += `<a-torus position="-0.2 3.65 0" radius="0.1" radius-tubular="0.012" arc="180" rotation="0 0 180" material="${mats.iron}"></a-torus>`;
    // Right side: mirror
    html += `<a-torus position="0.4 3.45 0" radius="0.2" radius-tubular="0.015" arc="180" rotation="0 0 0" material="${mats.iron}"></a-torus>`;
    html += `<a-torus position="0.2 3.65 0" radius="0.1" radius-tubular="0.012" arc="180" rotation="0 0 180" material="${mats.iron}"></a-torus>`;


    // ==========================================
    // 3. LANTERN HEAD BUILDER
    // ==========================================

    // All measurements inside buildLantern are local (relative to the entity position).
    // We carefully connect each piece so nothing floats or overlaps.
    //
    // Anatomy (bottom to top), all Y local:
    //   Base fitting:  cylinder  y=0,       h=0.06, top=0.03+0.03=0.06... wait:
    //                  centre y=0, h=0.06 → bottom at -0.03, top at 0.03
    //   Flare cone:    bottom connects at top of fitting (y=0.03),
    //                  height=0.1 → centre at 0.03+0.05=0.08, top at 0.13
    //   Glass bottom:  base connects at flare top (y=0.13),
    //                  height=0.3 → centre at 0.13+0.15=0.28, top at 0.43
    //   Glass top:     base at 0.43, height=0.2 → centre at 0.43+0.10=0.53, top at 0.63
    //   Cap disc:      base at 0.63, height=0.04 → centre at 0.63+0.02=0.65, top at 0.67
    //   Roof cone:     base at 0.67, height=0.18 → centre at 0.67+0.09=0.76, top at 0.85
    //   Ball finial:   centre at top of cone = 0.85+0.03=0.88 (radius 0.03)
    //   Spike cone:    base at 0.91, height=0.1 → centre at 0.91+0.05=0.96, tip at 1.01
    //
    //   Iron cage struts: span from flare top (y=0.13) to cap disc bottom (y=0.63), height=0.50
    //                     centre at (0.13+0.63)/2 = 0.38, height=0.50
    //   Glass urn mid:    for the cage radius reference → widest glass radius is 0.18
    //   Strut radius:     place at 0.185 (just outside glass) ← same as original, correct

    const buildLantern = (x, y, z, scale = 1) => {
      let s = `<a-entity position="${x} ${y} ${z}" scale="${scale} ${scale} ${scale}">`;

      // 3A. Base fitting (centre at y=0)
      s += `<a-cylinder position="0 0 0" radius="0.08" height="0.06" material="${mats.iron}"></a-cylinder>`;
      // Flare cone connecting fitting top to glass bottom: centre at 0.08
      s += `<a-cone position="0 0.08 0" radius-bottom="0.04" radius-top="0.12" height="0.1" material="${mats.iron}"></a-cone>`;

      // 3B. Glass urn
      // Bottom cone (flares out): base at y=0.13, centre at 0.28
      s += `<a-cone position="0 0.28 0" radius-bottom="0.12" radius-top="0.18" height="0.3" material="${mats.glassGlow}"></a-cone>`;
      // Top cone (tapers in): base at y=0.43, centre at 0.53
      s += `<a-cone position="0 0.53 0" radius-bottom="0.18" radius-top="0.14" height="0.2" material="${mats.glassGlow}"></a-cone>`;

      // 3C. Iron cage struts: span from y=0.13 to y=0.63, height=0.50, centre=0.38
      const strutR = 0.185;
      s += `<a-cylinder position="${strutR} 0.38 0" radius="0.008" height="0.50" material="${mats.iron}"></a-cylinder>`;
      s += `<a-cylinder position="-${strutR} 0.38 0" radius="0.008" height="0.50" material="${mats.iron}"></a-cylinder>`;
      s += `<a-cylinder position="0 0.38 ${strutR}" radius="0.008" height="0.50" material="${mats.iron}"></a-cylinder>`;
      s += `<a-cylinder position="0 0.38 -${strutR}" radius="0.008" height="0.50" material="${mats.iron}"></a-cylinder>`;

      // 3D. Cap disc: centre at 0.65
      s += `<a-cylinder position="0 0.65 0" radius="0.16" height="0.04" material="${mats.iron}"></a-cylinder>`;
      // Roof cone: centre at 0.76
      s += `<a-cone position="0 0.76 0" radius-bottom="0.16" radius-top="0.02" height="0.18" material="${mats.iron}"></a-cone>`;
      // Ball finial: sits at cone tip + radius = 0.85 + 0.03 = 0.88
      s += `<a-sphere position="0 0.88 0" radius="0.03" material="${mats.iron}"></a-sphere>`;
      // Sharp spike: base at 0.91, centre at 0.96
      s += `<a-cone position="0 0.96 0" radius-bottom="0.03" radius-top="0" height="0.1" material="${mats.iron}"></a-cone>`;

      // 3E. Light engine — point light at glass urn centre (y=0.38)
      s += `<a-light type="point" position="0 0.38 0" color="${mats.lightColor}" intensity="0.6" distance="10" decay="1.5"></a-light>`;

      // Volumetric fog halos (centered on light at y=0.38)
      s += `<a-sphere position="0 0.38 0" radius="1.5" material="color: ${mats.lightColor}; opacity: 0.06; transparent: true; shader: flat; side: back; depthWrite: false"></a-sphere>`;
      s += `<a-sphere position="0 0.38 0" radius="0.7" material="color: ${mats.lightColor}; opacity: 0.1; transparent: true; shader: flat; side: back; depthWrite: false"></a-sphere>`;

      s += `</a-entity>`;
      return s;
    };


    // ==========================================
    // 4. ATTACH THE 3 LANTERN HEADS
    // ==========================================

    // Side lanterns sit on top of the vertical stubs.
    // Stub tops are at y = 3.75 + 0.1 = 3.85.
    // Lantern local y=0 is its base fitting centre → position entity at stub top = 3.85.
    // Scale 0.9 applied uniformly so the side lanterns are slightly smaller.
    html += buildLantern(-0.8, 3.85, 0, 0.9);
    html += buildLantern(0.8, 3.85, 0, 0.9);

    // Center top lantern sits on top of the hub.
    // Hub top = 3.65 + 0.2 = 3.85. Top torus is at 3.85.
    // Give it a tiny spacer so it clears the torus: 3.85 + 0.015 ≈ 3.865.
    // Scale 1.1 so it reads as dominant.
    html += buildLantern(0, 3.87, 0, 1.1);

    el.innerHTML = html;
    this.el.appendChild(el);
  }
});