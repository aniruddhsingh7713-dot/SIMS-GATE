(() => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Replace the old 2D canvas with a fresh WebGL canvas.
  const oldCanvas = document.querySelector("#starfield");
  if (!oldCanvas) {
    console.error("AIRA: #starfield canvas not found.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.id = "aira-space";
  canvas.setAttribute("aria-hidden", "true");
  oldCanvas.replaceWith(canvas);

  let THREE;
  let renderer, scene, camera, stars, geometry, material;
  let positions, startPositions, targetPositions, colors, sizes, phases;
  let startTime = 0;
  let raf = 0;
  let width = 1, height = 1;
  let mouseX = 0, mouseY = 0;
  let currentProgress = 0;
  let disposed = false;

  const isMobile = matchMedia("(max-width: 700px)").matches;
  const COUNT = isMobile ? 14000 : 26000;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = t => t * t * (3 - 2 * t);

  function loadThree() {
    return new Promise((resolve, reject) => {
      if (window.THREE) {
        resolve(window.THREE);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      script.onload = () => resolve(window.THREE);
      script.onerror = () => reject(new Error("Three.js CDN failed to load"));
      document.head.appendChild(script);
    });
  }

  function makeLetterTargets() {
    const source = document.createElement("canvas");
    const ctx = source.getContext("2d");

    source.width = 1200;
    source.height = 320;

    if (!ctx) throw new Error("Letter canvas unavailable");

    // Large, bold AIRA letters become actual particle targets.
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 245px Manrope, sans-serif";
    ctx.fillText("AIRA", 600, 160);

    const pixels = ctx.getImageData(
      0, 0, source.width, source.height
    ).data;

    const points = [];

    for (let y = 0; y < source.height; y += 2) {
      for (let x = 0; x < source.width; x += 2) {
        const alpha = pixels[(y * source.width + x) * 4 + 3];

        if (alpha > 100 && Math.random() > 0.10) {
          points.push({ x, y });
        }
      }
    }

    // Shuffle for an even distribution over the letter silhouettes.
    for (let i = points.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [points[i], points[j]] = [points[j], points[i]];
    }

    return points;
  }

  function initialize() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    camera.position.set(0, 0, 100);

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);

    const letterPoints = makeLetterTargets();

    positions = new Float32Array(COUNT * 3);
    startPositions = new Float32Array(COUNT * 3);
    targetPositions = new Float32Array(COUNT * 3);
    colors = new Float32Array(COUNT * 3);
    sizes = new Float32Array(COUNT);
    phases = new Float32Array(COUNT);

    const palette = [
      new THREE.Color("#c9f4ff"),
      new THREE.Color("#71dfff"),
      new THREE.Color("#9bbcff"),
      new THREE.Color("#ffffff"),
      new THREE.Color("#48b8ff")
    ];

    const scale = isMobile ? 0.041 : 0.057;
    const letterCX = 600;
    const letterCY = 160;

    for (let i = 0; i < COUNT; i++) {
      const idx = i * 3;
      const p = letterPoints[i % letterPoints.length];

      // Initial positions are spread throughout 3D space.
      const radius = rand(25, 180);
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-1, 1));

      const sx = radius * Math.sin(phi) * Math.cos(theta);
      const sy = radius * Math.sin(phi) * Math.sin(theta);
      const sz = rand(-110, 70);

      startPositions[idx] = sx;
      startPositions[idx + 1] = sy;
      startPositions[idx + 2] = sz;

      // Keep the word centred and reserve the right side for the orb.
      const tx = (p.x - letterCX) * scale + (isMobile ? 0 : 5);
      const ty = -(p.y - letterCY) * scale;

      targetPositions[idx] = tx;
      targetPositions[idx + 1] = ty;
      targetPositions[idx + 2] = rand(-1.5, 1.5);

      positions[idx] = sx;
      positions[idx + 1] = sy;
      positions[idx + 2] = sz;

      const color = palette[Math.floor(Math.random() * palette.length)];

      colors[idx] = color.r;
      colors[idx + 1] = color.g;
      colors[idx + 2] = color.b;

      // Most stars remain tiny. A minority are naturally brighter.
      sizes[i] = Math.random() < 0.025 ? rand(1.8, 3.2) : rand(0.35, 1.15);
      phases[i] = rand(0, Math.PI * 2);
    }

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uProgress: { value: 0 }
      },
      vertexShader: `
        attribute float aSize;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uProgress;

        void main() {
          vColor = color;

          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          float twinkle = 0.72 + 0.28 * sin(
            uTime * 1.2 + position.x * 0.12 + position.y * 0.08
          );

          vAlpha = twinkle;

          gl_PointSize = clamp(
            aSize * uPixelRatio * twinkle * (90.0 / -mvPosition.z),
            1.0,
            9.0
          );

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);

          if (d > 0.5) discard;

          float core = exp(-d * d * 90.0);
          float glow = exp(-d * d * 18.0) * 0.28;

          float alpha = (core + glow) * vAlpha;

          gl_FragColor = vec4(vColor, alpha);
        }
      `
    });

    stars = new THREE.Points(geometry, material);
    scene.add(stars);

    // Subtle depth haze behind the letter formation.
    const hazeCanvas = document.createElement("canvas");
    hazeCanvas.width = 128;
    hazeCanvas.height = 128;

    const hctx = hazeCanvas.getContext("2d");

    if (hctx) {
      const gradient = hctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(15,100,200,0.12)");
      gradient.addColorStop(0.4, "rgba(8,55,130,0.05)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      hctx.fillStyle = gradient;
      hctx.fillRect(0, 0, 128, 128);

      const texture = new THREE.CanvasTexture(hazeCanvas);
      const haze = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );

      haze.scale.set(75, 50, 1);
      haze.position.set(0, 0, -8);
      scene.add(haze);
    }

    animate();
  }

  function animate(timestamp = 0) {
    if (disposed) return;

    raf = requestAnimationFrame(animate);

    if (!startTime) startTime = timestamp;

    const elapsed = (timestamp - startTime) / 1000;

    currentProgress = reducedMotion
      ? 1
      : smooth(clamp(elapsed / 5, 0, 1));

    const spiralStrength = reducedMotion ? 0 : (1 - currentProgress);

    for (let i = 0; i < COUNT; i++) {
      const idx = i * 3;
      const p = phases[i];

      const sx = startPositions[idx];
      const sy = startPositions[idx + 1];
      const sz = startPositions[idx + 2];

      const tx = targetPositions[idx];
      const ty = targetPositions[idx + 1];
      const tz = targetPositions[idx + 2];

      // A soft spiral approach, settling into the AIRA silhouette.
      const angle = elapsed * 0.5 + p;
      const spiralX = Math.cos(angle) * spiralStrength * 5;
      const spiralY = Math.sin(angle) * spiralStrength * 5;

      positions[idx] =
        sx + (tx - sx) * currentProgress + spiralX;

      positions[idx + 1] =
        sy + (ty - sy) * currentProgress + spiralY;

      positions[idx + 2] =
        sz + (tz - sz) * currentProgress;
    }

    geometry.attributes.position.needsUpdate = true;

    material.uniforms.uTime.value = elapsed;
    material.uniforms.uProgress.value = currentProgress;

    // Gentle parallax adds depth without distracting from the text.
    camera.position.x += (mouseX * 3 - camera.position.x) * 0.025;
    camera.position.y += (-mouseY * 2 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  canvas.addEventListener("pointermove", event => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  canvas.addEventListener("pointerleave", () => {
    mouseX = 0;
    mouseY = 0;
  });

  function onResize() {
    if (!renderer || !camera) return;

    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Recalculate the word shape for the new dimensions.
    const progress = currentProgress;
    buildLetterTargetsAfterResize(progress);
  }

  function buildLetterTargetsAfterResize(progress) {
    const source = document.createElement("canvas");
    source.width = 1200;
    source.height = 320;

    const sctx = source.getContext("2d");
    if (!sctx) return;

    sctx.fillStyle = "#fff";
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    sctx.font = "800 245px Manrope, sans-serif";
    sctx.fillText("AIRA", 600, 160);

    const pixels = sctx.getImageData(0, 0, 1200, 320).data;
    const points = [];

    for (let y = 0; y < 320; y += 2) {
      for (let x = 0; x < 1200; x += 2) {
        if (pixels[(y * 1200 + x) * 4 + 3] > 100) {
          points.push({ x, y });
        }
      }
    }

    const scale = width < 650 ? 0.041 : 0.057;

    for (let i = 0; i < COUNT; i++) {
      const p = points[i % points.length];
      const idx = i * 3;

      targetPositions[idx] = (p.x - 600) * scale + (width < 650 ? 0 : 5);
      targetPositions[idx + 1] = -(p.y - 160) * scale;
      targetPositions[idx + 2] = 0;
    }

    if (progress > 0) {
      for (let i = 0; i < COUNT * 3; i++) {
        positions[i] =
          startPositions[i] +
          (targetPositions[i] - startPositions[i]) * progress;
      }

      geometry.attributes.position.needsUpdate = true;
    }
  }

  window.addEventListener("resize", onResize);

  loadThree()
    .then(THREERef => {
      THREE = THREERef;

      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);

      initialize();
    })
    .catch(error => {
      console.error("AIRA WebGL initialization failed:", error);
      canvas.style.display = "none";
    });

  // Existing Lenis smooth scrolling.
  let lenis = null;

  if (!reducedMotion && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = time => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
  }

  // Existing GSAP reveal animations.
  if (window.gsap && !reducedMotion) {
    gsap.from(".navbar", {
      y: -12, opacity: 0, duration: 0.8, ease: "power3.out"
    });

    gsap.from(".hero .reveal", {
      y: 24, opacity: 0, duration: 1,
      stagger: 0.12, delay: 0.1, ease: "power3.out"
    });

    gsap.from(".orb-stage", {
      scale: 0.93, opacity: 0,
      duration: 1.3, delay: 0.15, ease: "power2.out"
    });

    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      gsap.utils.toArray("main section:not(.hero) .reveal")
        .forEach((el, i) => {
          gsap.from(el, {
            x: i % 2 ? 25 : -25,
            y: 12,
            opacity: 0,
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true
            }
          });
        });
    }
  }

  // Smooth internal navigation.
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();

      if (lenis) lenis.scrollTo(target, { offset: -20 });
      else target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth"
      });
    });
  });
})();

// AIRA reveal observer for sections, analytics, and story reveal elements.
(() => {
  const panels = document.querySelectorAll(
    ".comparison-panel, .chart-panel, .metrics-strip, .priority-row, .story-reveal, .intro, .statement, .capabilities, .approach, .aira-intelligence"
  );

  if (!panels.length) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reducedMotion || !("IntersectionObserver" in window)) {
    panels.forEach(panel => panel.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  panels.forEach(panel => observer.observe(panel));

  window.addEventListener("load", () => {
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  });
})();

// AIRA interactive live demo simulation controller
(() => {
  const progressItems = document.querySelectorAll(".demo-progress-item");
  if (!progressItems.length) return;

  const demoStatus = document.getElementById("demo-status");
  const demoMode = document.getElementById("demo-mode");
  const demoSubmode = document.getElementById("demo-submode");
  const demoCommand = document.getElementById("demo-command");
  const demoResult = document.getElementById("demo-result");
  const demoResultIcon = document.getElementById("demo-result-icon");
  const demoResultLabel = document.getElementById("demo-result-label");
  const demoResultTitle = document.getElementById("demo-result-title");
  const demoResultDesc = document.getElementById("demo-result-description");
  const demoResultMark = document.getElementById("demo-result-mark");
  const processSteps = document.querySelectorAll(".demo-process-line span");
  const waveform = document.getElementById("demo-waveform");

  const steps = [
    {
      status: "LISTENING FOR INPUT",
      mode: "Voice interface",
      submode: "Capturing audio stream",
      command: '"Open my workspace and get things ready."',
      icon: "⌁",
      label: "SYSTEM STATUS",
      title: "Audio Stream Active",
      desc: "Capturing intent via high-fidelity microphone channel",
      mark: "○",
      waveformState: "active"
    },
    {
      status: "INTERPRETING INTENT",
      mode: "Semantic Parser",
      submode: "Resolving workflow graph",
      command: '"Launch project workspace, arrange windows 60/40, start local dev servers"',
      icon: "◈",
      label: "CONTEXT RESOLUTION",
      title: "Workflow Graph Synthesized",
      desc: "Confidence 99.4% · Target: Local Desktop Automation Engine",
      mark: "◐",
      waveformState: "idle"
    },
    {
      status: "EXECUTING ACTION",
      mode: "Desktop Automation",
      submode: "Dispatching native hooks",
      command: '"Spawning VS Code, tiling windows to 60/40, running local dev server..."',
      icon: "⌘",
      label: "PROCESS DISPATCH",
      title: "Executing Python Subroutine",
      desc: "3 processes started · 0 permission warnings",
      mark: "◑",
      waveformState: "busy"
    },
    {
      status: "EXECUTION COMPLETE",
      mode: "Verification & Feedback",
      submode: "Workspace initialized",
      command: '"Workspace ready. Dev server running on localhost:3000."',
      icon: "✓",
      label: "COMPLETION REPORT",
      title: "All Tasks Finished",
      desc: "Total elapsed time: 1.2s · Ready for next command",
      mark: "●",
      waveformState: "done"
    }
  ];

  let currentStep = 0;
  let autoTimer = null;

  function renderStep(index) {
    currentStep = index;
    const data = steps[index];

    progressItems.forEach((item, i) => {
      item.classList.toggle("active", i === index);
    });

    if (demoStatus) demoStatus.textContent = data.status;
    if (demoMode) demoMode.textContent = data.mode;
    if (demoSubmode) demoSubmode.textContent = data.submode;
    if (demoCommand) demoCommand.textContent = data.command;
    if (demoResultIcon) demoResultIcon.textContent = data.icon;
    if (demoResultLabel) demoResultLabel.textContent = data.label;
    if (demoResultTitle) demoResultTitle.textContent = data.title;
    if (demoResultDesc) demoResultDesc.textContent = data.desc;
    if (demoResultMark) demoResultMark.textContent = data.mark;

    if (demoResult) {
      demoResult.classList.toggle("action-state", index >= 2);
    }

    processSteps.forEach((span, i) => {
      span.classList.toggle("complete", i <= index);
    });

    if (waveform) {
      waveform.setAttribute("data-state", data.waveformState);
    }
  }

  progressItems.forEach((item, i) => {
    item.addEventListener("click", () => {
      clearInterval(autoTimer);
      renderStep(i);
      startAuto();
    });
  });

  function startAuto() {
    autoTimer = setInterval(() => {
      if (document.hidden) return;
      const next = (currentStep + 1) % steps.length;
      renderStep(next);
    }, 4500);
  }

  renderStep(0);
  startAuto();
})();

// AIRA consolidated motion + live telemetry. No fake fallback data.
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Typewriter is reserved for two signature headings, not every title.
  const targets = [
    document.querySelector(".hero-title"),
    document.querySelector("#aira-live-demo .aira-story-heading h2")
  ].filter(Boolean);

  function typeFirstTextNode(el) {
    if (reduced || el.dataset.airaSignatureTyped) return;
    const node = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    if (!node) return;
    el.dataset.airaSignatureTyped = "true";
    const original = node.textContent;
    const span = document.createElement("span");
    span.className = "aira-signature-text";
    node.replaceWith(span);
    const cursor = document.createElement("i");
    cursor.className = "aira-typewriter-cursor";
    cursor.setAttribute("aria-hidden","true");
    span.after(cursor);
    let i = 0;
    function tick() {
      if (document.hidden) return setTimeout(tick, 500);
      span.textContent = original.slice(0, ++i);
      if (i >= original.length) {
        // Natural completion: leave text fully displayed and gracefully fade out cursor
        setTimeout(() => {
          cursor.style.transition = "opacity 0.6s ease";
          cursor.style.opacity = "0";
          setTimeout(() => cursor.remove(), 600);
        }, 1200);
        return;
      }
      setTimeout(tick, 55);
    }
    tick();
  }
  targets.forEach(typeFirstTextNode);

  const reveals=document.querySelectorAll(".intro .editorial-title,.statement-title,.capabilities .editorial-title,.approach .editorial-title,.aira-principle");
  if(reduced || !("IntersectionObserver" in window)) reveals.forEach(e=>e.classList.add("aira-motion-in"));
  else {
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{
      if(e.isIntersecting){e.target.classList.add("aira-motion-in");io.unobserve(e.target);}
    }),{threshold:.2});
    reveals.forEach(e=>io.observe(e));
  }

  const panel=document.getElementById("aira-live-telemetry");
  const empty=document.getElementById("aira-live-empty");
  if(!panel)return;
  const history={cpu:[],ram:[]}, limit=40;
  function num(obj,keys){
    for(const key of keys){
      let v=obj;
      for(const part of key.split(".")) v=v&&typeof v==="object"?v[part]:undefined;
      if(typeof v==="number"&&Number.isFinite(v))return Math.max(0,Math.min(100,v));
    }
    return null;
  }
  function draw(type,color){
    const canvas=document.getElementById(`aira-${type}-chart`),tip=document.getElementById(`aira-${type}-tip`),data=history[type];
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;
    const c=canvas.getContext("2d");c.scale(dpr,dpr);
    const w=rect.width,h=rect.height,L=30,R=w-8,T=10,B=h-22;
    c.clearRect(0,0,w,h);c.font="10px sans-serif";
    [0,25,50,75,100].forEach(v=>{const y=B-v/100*(B-T);c.strokeStyle="rgba(160,195,230,.14)";c.setLineDash([3,4]);c.beginPath();c.moveTo(L,y);c.lineTo(R,y);c.stroke();c.setLineDash([]);c.fillStyle="#8296ac";c.textAlign="right";c.fillText(v,L-7,y+3);});
    if(!data.length){c.fillStyle="#8296ac";c.textAlign="center";c.fillText("Waiting for real samples",(L+R)/2,h/2);return;}
    const pts=data.map((p,i)=>({x:data.length===1?(L+R)/2:L+i/(data.length-1)*(R-L),y:B-p.value/100*(B-T),p}));
    if(pts.length>1){const g=c.createLinearGradient(0,T,0,B);g.addColorStop(0,color+"30");g.addColorStop(1,color+"00");c.beginPath();c.moveTo(pts[0].x,B);pts.forEach(p=>c.lineTo(p.x,p.y));c.lineTo(pts.at(-1).x,B);c.closePath();c.fillStyle=g;c.fill();c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=2;c.stroke();}
    const last=pts.at(-1);c.beginPath();c.arc(last.x,last.y,3.5,0,Math.PI*2);c.fillStyle=color;c.fill();
    c.fillStyle="#8296ac";c.textAlign="left";c.fillText(pts[0].p.time.toLocaleTimeString(),L,h-5);c.textAlign="right";c.fillText("NOW",R,h-5);
    canvas.onpointermove=e=>{const x=e.clientX-canvas.getBoundingClientRect().left;const p=pts.reduce((a,b)=>Math.abs(b.x-x)<Math.abs(a.x-x)?b:a);tip.style.display="block";tip.style.left=Math.max(0,Math.min(w-160,p.x+8))+"px";tip.style.top=Math.max(0,p.y-18)+"px";tip.textContent=p.p.value.toFixed(1)+"% · "+p.p.time.toLocaleTimeString();};
    canvas.onpointerleave=()=>tip.style.display="none";
  }
  async function poll(){
    try{
      const res=await fetch("http://127.0.0.1:8000/api/system-status",{cache:"no-store"});
      if(!res.ok)throw Error("HTTP "+res.status);
      const raw=await res.json(),o=raw.data??raw.system_status??raw;
      const cpu=num(o,["cpu_percent","cpu_usage","cpu","cpu.percent","cpu.percentage","cpu.usage_percent"]);
      const ram=num(o,["ram_percent","memory_percent","memory_usage_percent","ram_usage","memory.percent","memory.percentage","memory.usage_percent","ram.percent"]);
      if(cpu===null&&ram===null)throw Error("No recognised CPU/RAM percentage fields in API response.");
      for(const [type,value] of [["cpu",cpu],["ram",ram]]){
        if(value===null)continue;
        history[type].push({value,time:new Date()});if(history[type].length>limit)history[type].shift();
        document.getElementById(`aira-${type}-value`).innerHTML=value.toFixed(1)+"<small> %</small>";
        document.getElementById(`aira-${type}-status`).textContent="Live reading · "+new Date().toLocaleTimeString();
        draw(type,type==="cpu"?"#50e9ff":"#aa92ff");
      }
      empty.hidden=true;
    }catch(err){
      empty.hidden=false;
      empty.innerHTML="<strong>Live telemetry unavailable</strong>"+err.message+"<br>No synthetic values are plotted. Check the backend endpoint and its JSON fields.";
    }
  }
  poll();setInterval(()=>{if(!document.hidden)poll();},3000);
  addEventListener("resize",()=>{draw("cpu","#50e9ff");draw("ram","#aa92ff");});
})();
