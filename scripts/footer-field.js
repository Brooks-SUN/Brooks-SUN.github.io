// Preserve the approved dark sea and lighting; prioritize readable text pixels.
// GPU resources are prepared only when the footer approaches the viewport.
function bindFooterField(stage, canvas, motion) {
  if (!stage || !canvas || stage.dataset.wordSeaBound) return;
  stage.dataset.wordSeaBound = "true";
  const preview = canvas.cloneNode(false);
  preview.removeAttribute("data-footer-canvas");
  preview.removeAttribute("role");
  preview.removeAttribute("aria-label");
  preview.setAttribute("aria-hidden", "true");
  preview.dataset.footerPreview = "";
  stage.prepend(preview);
  const previewContext = preview.getContext("2d");
  let gl = null, preload;
  const state = {
    renderer: "pending",
    ready: false,
    paused: motion.matches,
    visible: false,
    visibilityRatio: 0,
    lost: false,
    loading: false,
    time: 15,
    frame: 0,
    last: 0,
    quality: "auto",
    level: innerWidth < 650 ? 1 : 2,
    width: 0,
    height: 0,
    dpr: 1,
    resolutionLimited: false,
    words: 0,
    nearWords: 0,
    streaks: 0,
    drawCalls: 0,
    frameTimes: [],
    fps: 0,
    autoAdjustments: 0,
    frames: 0,
    atlasMs: 0,
    loadReason: null
  };
  let targetX = 0, targetY = 0, mouseX = 0, mouseY = 0, resizeTimer, atlas, programs, wordVao, streakVao, emptyVao, wordBuffer, streakBuffer, texture, targets, surfaceVao, surfaceBuffer, surfaceIndex, surfaceCount;
  const words = ["cognition", "collaboration", "reasoning", "learning", "memory", "agents", "intelligence", "emergence", "knowledge", "perception", "collective", "trust", "alignment", "adaptation", "discovery", "connection", "planning", "inference", "shared", "attention", "language", "thought", "curiosity", "understanding", "coordination", "communication", "exploration", "experience", "meaning", "research", "systems", "possibility", "networks", "horizon", "insight", "multi-agent", "autonomy", "human", "science", "feedback", "world", "sense", "evolve", "imagine", "together", "observe", "learn", "reason", "\u534F\u4F5C", "\u8BA4\u77E5", "\u63A8\u7406", "\u6D8C\u73B0", "\u667A\u80FD", "\u611F\u77E5", "\u5B66\u4E60", "\u5171\u8BC6", "\u8BB0\u5FC6", "\u77E5\u8BC6", "\u63A2\u7D22", "\u8FDE\u63A5", "\u601D\u8003", "\u591A\u667A\u80FD\u4F53", "\u534F\u540C", "\u7406\u89E3", "\u4FE1\u4EFB", "\u53D1\u73B0"];
  let seed = 1947;
  function random() {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function edt1d(grid, offset, stride, n, f, d, v, z) {
    let k = 0;
    v[0] = 0;
    z[0] = -1e20;
    z[1] = 1e20;
    for (let q = 0; q < n; q++) f[q] = grid[offset + q * stride];
    for (let q = 1; q < n; q++) {
      let s;
      do {
        s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
        if (s <= z[k]) k--;
        else break;
      } while (k >= 0);
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = 1e20;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) k++;
      d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
    }
    for (let q = 0; q < n; q++) grid[offset + q * stride] = d[q];
  }
  function edt(grid, w, h) {
    const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    for (let x = 0; x < w; x++) edt1d(grid, x, w, h, f, d, v, z);
    for (let y = 0; y < h; y++) edt1d(grid, y * w, 1, w, f, d, v, z);
  }
  function makeAtlas() {
    const started = performance.now(), w = 2048, h = 1024, c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "middle";
    let x = 14, y = 10;
    const entries = [];
    words.forEach((word, i) => {
      ctx.font = /[\u3400-\u9fff]/.test(word) ? '46px "Microsoft YaHei", sans-serif' : `${i % 7 === 0 ? "italic " : ""}50px "Palatino Linotype", Georgia, serif`;
      const width = Math.ceil(ctx.measureText(word).width) + 28;
      if (x + width > w) {
        x = 14;
        y += 82;
      }
      if (y + 78 > h) throw new Error("Font atlas overflow");
      ctx.fillText(word, x + 14, y + 38);
      entries.push({ u: x / w, v: 1 - (y + 76) / h, uw: width / w, vh: 76 / h, aspect: width / 76 });
      x += width + 8;
    });
    const alpha = ctx.getImageData(0, 0, w, h).data, outer = new Float32Array(w * h), inner = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const a = alpha[i * 4 + 3] / 255;
      outer[i] = a === 1 ? 0 : a === 0 ? 1e10 : Math.max(0, 0.5 - a) ** 2;
      inner[i] = a === 1 ? 1e10 : a === 0 ? 0 : Math.max(0, a - 0.5) ** 2;
    }
    edt(outer, w, h);
    edt(inner, w, h);
    const data = new Uint8Array(w * h);
    for (let i = 0; i < data.length; i++) data[i] = clamp(Math.round(128 - (Math.sqrt(outer[i]) - Math.sqrt(inner[i])) * 16), 0, 255);
    state.atlasMs = Math.round(performance.now() - started);
    return { w, h, data, entries };
  }
  const header=`#version 300 es
precision highp float;
`;
  const waves=`
float wave(vec2 p,float t){return sin(p.x*.14+p.y*.20-t*.64)*1.03+sin(p.x*-.255+p.y*.30+t*.43)*.52+sin(p.x*.085+p.y*.07-t*.26)*.34+sin(p.x*.53+p.y*.47-t*.79)*.15+sin(p.x*-.77+p.y*.66+t*.63)*.065;}
vec2 slope(vec2 p,float t){return vec2(.14,.20)*cos(p.x*.14+p.y*.20-t*.64)*1.03+vec2(-.255,.30)*cos(p.x*-.255+p.y*.30+t*.43)*.52+vec2(.085,.07)*cos(p.x*.085+p.y*.07-t*.26)*.34+vec2(.53,.47)*cos(p.x*.53+p.y*.47-t*.79)*.15+vec2(-.77,.66)*cos(p.x*-.77+p.y*.66+t*.63)*.065;}
`;
  const cameraUniforms=`uniform vec3 uCamera,uRight,uUp,uForward;uniform float uAspect,uTan,uTime;uniform vec2 uResolution;
vec4 project(vec3 p){vec3 d=p-uCamera;float z=dot(d,uForward);return vec4(dot(d,uRight)/(uTan*uAspect),dot(d,uUp)/uTan,z*1.000924-.600277,z);}
`;
  const fullscreenVS=header+`out vec2 vUv;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
// The same moving reflection illuminates the water and its words. Its energy
// reaches the middle and far field instead of pooling under the camera.
  const seaLight=`
vec3 seaReflection(vec3 p,vec2 s,float t){
 float distance=length(p-uCamera);
 vec2 ripple=vec2(sin(p.x*1.6+p.z*2.1+t*1.15),sin(p.x*-2.0+p.z*1.45-t*.95))*.047;
 vec3 normal=normalize(vec3(-s.x-ripple.x,1.,-s.y-ripple.y));
 vec3 view=normalize(uCamera-p);vec3 sun=normalize(vec3(.012,.045,-1.));
 float spec=max(0.,dot(normal,normalize(view+sun)));
 float shift=sin(p.z*.075-t*.22)*1.45;
 float ribbon=exp(-pow(abs(p.x-shift)/(3.2+distance*.029),1.6));
 float strips=pow(.5+.5*sin(p.z*1.85+p.x*.22+sin(p.x*.62-t*.42)*1.2-t*1.05),9.);
 float breakup=.42+.58*pow(.5+.5*sin(p.x*2.15-p.z*.41+t*.6),2.);
 float reach=mix(.46,1.85,smoothstep(22.,135.,distance));
 float sheen=pow(spec,22.)*.52;
 float sparkle=pow(spec,100.)*.90+strips*breakup*ribbon*.82;
 return vec3(ribbon,sheen*reach,sparkle*reach);
}
`;
  const backgroundFS=header+cameraUniforms+`
in vec2 vUv;out vec4 outColor;
void main(){
 vec2 ndc=vUv*2.-1.;vec3 ray=normalize(uForward+uRight*ndc.x*uAspect*uTan+uUp*ndc.y*uTan);vec3 base=vec3(6.,9.,19.)/255.;vec3 col=base;
 float horizon=.5-dot(uForward,vec3(0,1,0))/(2.*uTan*dot(uUp,vec3(0,1,0)));
 float band=exp(-abs(vUv.y-horizon)*33.);float centre=exp(-pow((vUv.x-.5)*2.3,2.));
 col+=vec3(.049,.102,.097)*band*centre;
 vec2 light=(vUv-vec2(.502,horizon+.011))*vec2(uAspect,1.);float r=length(light);
 col+=vec3(.13,.20,.16)*exp(-r*14.);
 col+=vec3(.52,.56,.40)*exp(-r*54.)*.78;
 col+=vec3(.90,.82,.61)*(1.-smoothstep(.0065,.010,r));
 // Subpixel, distant ripples bridge the finite word field and the horizon.
 float below=horizon-vUv.y;
 if(below>0.&&below<.065){
   float path=exp(-pow(abs(vUv.x-.502)/(.007+below*.52),1.4));
   float stripes=pow(.5+.5*sin(below*850.+sin(vUv.x*103.)*1.7-uTime*.85),5.);
   float broken=.40+.60*pow(.5+.5*sin(vUv.x*920.+below*430.-uTime*.44),2.);
   col+=vec3(.40,.52,.39)*path*(.17+stripes*broken*.90)*(1.-smoothstep(.035,.065,below));
 }
 float fade=smoothstep(0.,.065,vUv.y)*(1.-smoothstep(.90,1.,vUv.y));col=mix(base,col,fade);
 outColor=vec4(col,1.);
}`;
  const surfaceVS=header+cameraUniforms+waves+`layout(location=0)in vec2 aPoint;out vec3 vWorld;void main(){vWorld=vec3(aPoint.x,wave(aPoint,uTime)-.10,aPoint.y);gl_Position=project(vWorld);}`;
  const surfaceFS=header+cameraUniforms+waves+seaLight+`
in vec3 vWorld;out vec4 outColor;
void main(){
 vec2 s=slope(vWorld.xz,uTime);vec3 light=seaReflection(vWorld,s,uTime);
 float distance=length(vWorld-uCamera);float crest=smoothstep(-.7,1.4,vWorld.y);
 vec3 base=vec3(6.,9.,19.)/255.;vec3 col=base+vec3(.013,.033,.032)*(crest*.7+.12);
 // Keep the carrier water dark: bright flecks and typed crests carry the light.
 float detail=1.-smoothstep(.65,2.8,length(fwidth(vWorld.xz)));
 col+=vec3(.19,.34,.29)*(light.x*.050+light.y*.30);
 col+=mix(vec3(.54,.78,.67),vec3(.82,.78,.53),smoothstep(55.,220.,distance))
      *light.z*(.38+.26*detail);
 float edge=1.-smoothstep(210.,450.,distance);
 col=mix(base,col,edge);outColor=vec4(col,1.);
}`;
  const wordVS=header+cameraUniforms+waves+seaLight+`
layout(location=0)in vec4 aPlace;layout(location=1)in vec4 aAtlas;layout(location=2)in vec4 aDetail;
out vec2 vUv;out vec2 vLocal;out vec3 vColor;out float vAlpha;out float vPixels;out float vStreak;
void main(){
 vec2 corner=vec2(float(gl_VertexID==1||gl_VertexID==2||gl_VertexID==4),float(gl_VertexID==2||gl_VertexID==4||gl_VertexID==5));vec2 q=corner-.5;
 float seed=aPlace.w;vec3 p;float depth;vec3 color;float alpha;
 if(aDetail.w<.5){
   vec2 origin=aPlace.xy;origin.x+=sin(uTime*.10+seed*30.)*.11;origin.y+=sin(uTime*.07+seed*20.)*.13;
   float height=wave(origin,uTime);vec2 s=slope(origin,uTime);float yaw=aDetail.y;
   vec2 local=vec2(q.x*aDetail.x,q.y)*aPlace.z;
   p=vec3(origin.x+local.x*cos(yaw),height+.20+local.y*.60+local.x*s.x-local.y*.76*s.y,origin.y+local.x*sin(yaw)-local.y*.76);
   depth=length(p-uCamera);
   float crest=smoothstep(-.65,1.5,height)*.43+smoothstep(-.19,.40,s.y)*.25;
   vec3 light=seaReflection(vec3(origin.x,height,origin.y),s,uTime);
   float reflection=light.x;float glint=light.z;
   color=mix(vec3(.31,.56,.55),vec3(.83,.94,.87),crest*.68+reflection*.24);
   if(seed>.976)color=mix(color,vec3(.70,.53,.31),.7);
   vec3 reflected=mix(vec3(.62,.82,.72),vec3(.92,.86,.62),smoothstep(45.,210.,depth));
   color+=reflected*(light.y*.82+glint*1.12);
   color+=vec3(.16,.22,.18)*reflection*smoothstep(22.,100.,depth);
   alpha=clamp((.53+crest*.28+reflection*.22+glint*.16)*exp(-depth*.0011)*aDetail.z,0.,.97);
   vPixels=aPlace.z*uResolution.y/(2.*uTan*max(.1,dot(p-uCamera,uForward)));
   alpha*=smoothstep(.55,1.8,vPixels);
   vStreak=0.;
 }else{
   float phase=fract(seed+uTime*.007);float side=aPlace.x;float reach=pow(phase,.78);
   p=vec3(side*(1.+reach*110.),1.4+pow(phase,.8)*aPlace.y,-153.+reach*34.);
   vec3 direction=normalize(vec3(side,aPlace.y/110.,.22));
   p+=direction*q.x*aDetail.x+uUp*q.y*aPlace.z;
   depth=length(p-uCamera);color=mix(vec3(.25,.47,.47),vec3(.54,.69,.66),seed);
   alpha=sin(phase*3.14159)*(.12+.26*aDetail.z);vPixels=3.;vStreak=1.;
 }
 vColor=color;vAlpha=alpha;vUv=aAtlas.xy+corner*aAtlas.zw;vLocal=corner;
 gl_Position=project(p);
}`;
  const wordFS=header+`uniform sampler2D uAtlas;in vec2 vUv;in vec2 vLocal;in vec3 vColor;in float vAlpha;in float vPixels;in float vStreak;out vec4 outColor;
void main(){float ink;if(vStreak>.5){ink=pow(max(0.,1.-abs(vLocal.y*2.-1.)),1.3)*sin(vLocal.x*3.14159);}else{float sdf=texture(uAtlas,vUv).r;float edgeWidth=mix(.8,.55,smoothstep(5.,18.,vPixels));float aa=max(fwidth(sdf)*edgeWidth,.015);ink=smoothstep(.5-aa,.5+aa,sdf);}float alpha=ink*vAlpha;if(alpha<.006)discard;outColor=vec4(vColor*alpha,alpha);}`;
  const blurFS=header+`in vec2 vUv;uniform sampler2D uImage;uniform vec2 uStep;uniform float uExtract;out vec4 outColor;
vec3 sampleAt(vec2 p){vec3 c=texture(uImage,p).rgb;return c*mix(1.,smoothstep(.16,.60,max(c.r,max(c.g,c.b))),uExtract);}
void main(){vec3 c=sampleAt(vUv)*.227027;c+=sampleAt(vUv+uStep*1.384615)*.316216;c+=sampleAt(vUv-uStep*1.384615)*.316216;c+=sampleAt(vUv+uStep*3.230769)*.070270;c+=sampleAt(vUv-uStep*3.230769)*.070270;outColor=vec4(c,1.);}`;
  const finalFS=header+`in vec2 vUv;uniform sampler2D uImage,uGlow;uniform float uTime;out vec4 outColor;
void main(){vec3 base=vec3(6.,9.,19.)/255.;float bloom=mix(.18,.40,smoothstep(.18,.52,vUv.y));vec3 color=texture(uImage,vUv).rgb+texture(uGlow,vUv).rgb*bloom;float sides=smoothstep(0.,.045,vUv.x)*(1.-smoothstep(.955,1.,vUv.x));float bottom=smoothstep(0.,.10,vUv.y);color=mix(base,color,sides*bottom);outColor=vec4(color,1.);}`;
  function compile(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(vs, fs) {
    const p = gl.createProgram(), v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const locations = {};
    return { p, at: (n) => locations[n] ?? (locations[n] = gl.getUniformLocation(p, n)) };
  }
  function uniform(p, name, value) {
    const loc = p.at(name);
    if (loc === null) return;
    if (typeof value === "number") gl.uniform1f(loc, value);
    else if (value.length === 2) gl.uniform2fv(loc, value);
    else gl.uniform3fv(loc, value);
  }
  function makeInstances(data) {
    const vao = gl.createVertexArray(), buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    for (let i = 0; i < 3; i++) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, 4, gl.FLOAT, false, 48, i * 16);
      gl.vertexAttribDivisor(i, 1);
    }
    gl.bindVertexArray(null);
    return { vao, buffer };
  }
  function buildWords() {
    seed = 1947;
    const data = [];
    const aspect = state.width / state.height;
    // Generate the same candidates at every detail level: near words never move
    // or disappear when performance adaptation thins the distant texture.
    const density = 1.02;
    state.nearWords = 0;
    for (let z = -235; z < 22; z += density * (1.02 + (26 - z) * 26e-4)) {
      const half = (26 - z) * 0.474 * aspect + 4;
      let x = -half;
      while (x < half) {
        const entry = atlas.entries[Math.floor(random() * atlas.entries.length)];
        const size = 0.66 + random() * 0.3;
        const width = size * entry.aspect;
        const gap = 0.1 + random() * 0.2;
        const px = x + width * 0.5 + (random() - 0.5) * 0.1, pz = z + (random() - 0.5) * density * 0.43;
        const placementSeed = random(), yaw = (random() - 0.5) * .32, opacity = .6 + random() * .4;
        const distance = 26 - z;
        const keep = state.level === 2 ? 1 : state.level === 1
          ? clamp(1 - (distance - 42) / 230, .45, 1)
          : clamp(1 - (distance - 42) / 110, .18, 1);
        if ((placementSeed * 113) % 1 < keep) {
          data.push(px, pz, size, placementSeed, entry.u, entry.v, entry.uw, entry.vh, entry.aspect, yaw, opacity, 0);
          if (distance <= 42) state.nearWords++;
        }
        x += width + gap;
      }
    }
    if (wordVao) gl.deleteVertexArray(wordVao);
    if (wordBuffer) gl.deleteBuffer(wordBuffer);
    const built = makeInstances(data);
    wordVao = built.vao;
    wordBuffer = built.buffer;
    state.words = data.length / 12;
    const trails = [];
    for (let i = 0; i < [500, 1200, 2800][state.level]; i++) {
      trails.push(random() > 0.5 ? 1 : -1, 4 + random() * 15, 0.11 + random() * 0.12, random(), 0, 0, 0, 0, 0.35 + random() * 2.4, 0, random(), 1);
    }
    if (streakVao) gl.deleteVertexArray(streakVao);
    if (streakBuffer) gl.deleteBuffer(streakBuffer);
    const streak = makeInstances(trails);
    streakVao = streak.vao;
    streakBuffer = streak.buffer;
    state.streaks = trails.length / 12;
  }
  function buildSurface() {
    if (surfaceVao) gl.deleteVertexArray(surfaceVao);
    if (surfaceBuffer) gl.deleteBuffer(surfaceBuffer);
    if (surfaceIndex) gl.deleteBuffer(surfaceIndex);
    const positions = [], indices = [], columns = [64, 80, 96][state.level], rows = [100, 130, 160][state.level], far = 245, aspect = state.width / state.height;
    for (let row = 0; row <= rows; row++) {
      const z = 24 - Math.pow(row / rows, 1.55) * (far + 24);
      const half = (26 - z) * 0.48 * aspect + 5;
      for (let col = 0; col <= columns; col++) {
        positions.push((col / columns * 2 - 1) * half, z);
        if (row && col) {
          const i = row * (columns + 1) + col;
          indices.push(i, i - 1, i - columns - 2, i, i - columns - 2, i - columns - 1);
        }
      }
    }
    surfaceCount = indices.length;
    surfaceVao = gl.createVertexArray();
    gl.bindVertexArray(surfaceVao);
    surfaceBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, surfaceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    surfaceIndex = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, surfaceIndex);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
  }
  function target(w, h, depth = false) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    let depthBuffer = null;
    if (depth) {
      depthBuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
    }
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Framebuffer unavailable");
    return { tex, fbo, w, h, depthBuffer };
  }
  function disposeTargets() {
    if (targets) for (const t of targets) {
      gl.deleteFramebuffer(t.fbo);
      gl.deleteTexture(t.tex);
      if (t.depthBuffer) gl.deleteRenderbuffer(t.depthBuffer);
    }
  }
  function resize() {
    const parent = stage.parentElement.getBoundingClientRect();
    stage.style.width = document.documentElement.clientWidth + "px";
    stage.style.marginLeft = -parent.left + "px";
    stage.style.marginRight = "0px";
    if (!preview.hidden) drawPreview();
    if (!state.ready || state.lost) return;
    const r = stage.getBoundingClientRect();
    // Lower distant detail first. Only sustained overload at minimum detail can
    // limit HiDPI to 1.5x; normal adaptation keeps the native (up to 2x) canvas.
    const maxDpr = state.resolutionLimited ? 1.5 : 2;
    const pixelBudget = 4500000;
    state.dpr = Math.min(devicePixelRatio || 1, maxDpr, Math.sqrt(pixelBudget / Math.max(1, r.width * r.height)));
    if (r.width < 1 || r.height < 1) return;
    state.width = Math.round(r.width);
    state.height = Math.round(r.height);
    canvas.width = Math.round(r.width * state.dpr);
    canvas.height = Math.round(r.height * state.dpr);
    disposeTargets();
    targets = [target(canvas.width, canvas.height, true), target(Math.max(1, canvas.width >> 2), Math.max(1, canvas.height >> 2)), target(Math.max(1, canvas.width >> 2), Math.max(1, canvas.height >> 2))];
    buildWords();
    buildSurface();
    draw();
  }
  function normalize(v) {
    const l = Math.hypot(...v);
    return v.map((n) => n / l);
  }
  function camera() {
    const position = [mouseX * 1.8, 7.2 + mouseY * 0.6, 26], forward = normalize([-mouseX * 0.8, -7 - mouseY * 0.25, -68]);
    const right = normalize([-forward[2], 0, forward[0]]);
    const up = [right[1] * forward[2] - right[2] * forward[1], right[2] * forward[0] - right[0] * forward[2], right[0] * forward[1] - right[1] * forward[0]];
    return { uCamera: position, uForward: forward, uRight: right, uUp: up, uAspect: state.width / state.height, uTan: Math.tan(25 * Math.PI / 180), uTime: state.time, uResolution: [canvas.width, canvas.height] };
  }
  function bindTexture(p, name, tex, index) {
    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(p.at(name), index);
  }
  function screen(p, targetValue) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetValue?.fbo ?? null);
    gl.viewport(0, 0, targetValue?.w ?? canvas.width, targetValue?.h ?? canvas.height);
    gl.useProgram(p.p);
    gl.bindVertexArray(emptyVao);
  }
  function draw() {
    if (!state.ready || state.lost || !targets) return;
    const cam = camera();
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    screen(programs.background, targets[0]);
    for (const [key, value] of Object.entries(cam)) uniform(programs.background, key, value);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(programs.surface.p);
    for (const [key, value] of Object.entries(cam)) uniform(programs.surface, key, value);
    gl.bindVertexArray(surfaceVao);
    gl.drawElements(gl.TRIANGLES, surfaceCount, gl.UNSIGNED_SHORT, 0);
    gl.depthMask(false);
    gl.useProgram(programs.word.p);
    for (const [key, value] of Object.entries(cam)) uniform(programs.word, key, value);
    bindTexture(programs.word, "uAtlas", texture, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindVertexArray(wordVao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, state.words);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.bindVertexArray(streakVao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, state.streaks);
    gl.disable(gl.BLEND);
    screen(programs.blur, targets[1]);
    bindTexture(programs.blur, "uImage", targets[0].tex, 0);
    uniform(programs.blur, "uExtract", 1);
    uniform(programs.blur, "uStep", [1 / targets[1].w, 0]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    screen(programs.blur, targets[2]);
    bindTexture(programs.blur, "uImage", targets[1].tex, 0);
    uniform(programs.blur, "uExtract", 0);
    uniform(programs.blur, "uStep", [0, 1 / targets[2].h]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    screen(programs.final, null);
    bindTexture(programs.final, "uImage", targets[0].tex, 0);
    bindTexture(programs.final, "uGlow", targets[2].tex, 1);
    uniform(programs.final, "uTime", state.time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    state.drawCalls = 7;
    state.frames++;
  }
  function canAnimate() {
    return state.ready && !state.paused && state.visible && !document.hidden && !state.lost;
  }
  function frame(now) {
    state.frame = 0;
    if (!canAnimate()) return;
    const elapsed = state.last ? now - state.last : 16.67;
    state.last = now;
    const dt = Math.min(elapsed, 50) / 1e3;
    state.time += dt;
    mouseX += (targetX - mouseX) * (1 - Math.exp(-dt * 3));
    mouseY += (targetY - mouseY) * (1 - Math.exp(-dt * 3));
    draw();
    if (elapsed > 0 && elapsed < 250) {
      state.frameTimes.push(elapsed);
      if (state.frameTimes.length > 180) state.frameTimes.shift();
    }
    if (state.frameTimes.length >= 90 && state.frames % 90 === 0) {
      const sorted = [...state.frameTimes].sort((a, b) => a - b);
      const middle = sorted[Math.floor(sorted.length * 0.5)];
      state.fps = Math.round(1e3 / middle);
      if (state.quality === "auto") {
        if (middle > 22 && state.level > 0) {
          state.level--;
          state.autoAdjustments++;
          state.frameTimes = [];
          resize();
        } else if (middle > 36 && state.level === 0 && !state.resolutionLimited) {
          state.resolutionLimited = true;
          state.autoAdjustments++;
          state.frameTimes = [];
          resize();
        }
      }
    }
    state.frame = requestAnimationFrame(frame);
  }
  function sync() {
    if (state.frame) {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    }
    state.last = 0;
    if (canAnimate()) state.frame = requestAnimationFrame(frame);
  }
  function initializeGPU() {
    programs = { surface: program(surfaceVS, surfaceFS), background: program(fullscreenVS, backgroundFS), word: program(wordVS, wordFS), blur: program(fullscreenVS, blurFS), final: program(fullscreenVS, finalFS) };
    emptyVao = gl.createVertexArray();
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const flipped = new Uint8Array(atlas.data.length);
    for (let y = 0; y < atlas.h; y++) flipped.set(atlas.data.subarray(y * atlas.w, (y + 1) * atlas.w), (atlas.h - 1 - y) * atlas.w);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, atlas.w, atlas.h, 0, gl.RED, gl.UNSIGNED_BYTE, flipped);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    const anisotropy = gl.getExtension("EXT_texture_filter_anisotropic");
    if (anisotropy) {
      gl.texParameterf(gl.TEXTURE_2D, anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,
        Math.min(4, gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    }
    state.ready = true;
    state.renderer = "webgl";
    stage.dataset.footerRenderer = "webgl";
    resize();
    preview.hidden = true;
    canvas.style.visibility = "visible";
    sync();
  }
  function drawPreview() {
    const r = stage.getBoundingClientRect(), ctx = previewContext;
    if (!ctx || r.width < 1 || r.height < 1) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    preview.width = Math.round(r.width * dpr);
    preview.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#060913";
    ctx.fillRect(0, 0, r.width, r.height);
    const horizon = r.height * 0.39;
    const halo = ctx.createRadialGradient(r.width * 0.502, horizon, 0, r.width * 0.502, horizon, r.height * 0.3);
    halo.addColorStop(0, "#b5c79488");
    halo.addColorStop(0.14, "#9edfd638");
    halo.addColorStop(1, "#06091300");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, r.width, r.height);
    ctx.fillStyle = "#eddfb5";
    ctx.beginPath();
    ctx.arc(r.width * 0.502, horizon, r.height * 8e-3, 0, Math.PI * 2);
    ctx.fill();
    seed = 1947;
    for (let y = horizon + 4; y < r.height - 10; y += 6 + y / r.height * 10) {
      const f = (y - horizon) / r.height;
      for (let x = -40; x < r.width; x += 40 + f * 90) {
        const reflection = Math.exp(-Math.pow((x - r.width * 0.5) / (8 + f * r.width * 0.22), 2));
        ctx.font = 6 + f * 20 + "px Georgia";
        ctx.fillStyle = "rgba(158,223,214," + (0.13 + f * 0.45 + reflection * 0.32) + ")";
        ctx.fillText(words[Math.floor(random() * words.length)], x + random() * 20, y + Math.sin(x * 0.02 + y * 0.02) * f * 23);
      }
    }
  }
  function fallback(error) {
    state.ready = false;
    state.loading = false;
    state.lost = false;
    state.renderer = "fallback";
    stage.dataset.footerRenderer = "fallback";
    canvas.style.visibility = "hidden";
    preview.hidden = false;
    drawPreview();
    sync();
    if (error) console.warn("Word sea is using its static fallback.", error);
  }
  function initialize(reason = "nearby") {
    if (state.renderer !== "pending" || state.loading || document.hidden) return;
    state.loading = true;
    state.loadReason = reason;
    preload?.disconnect();
    requestAnimationFrame(() => {
      if (document.hidden) {
        state.loading = false;
        return;
      }
      try {
        gl = canvas.getContext("webgl2", {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false
        });
        if (!gl) {
          fallback();
          return;
        }
        atlas = makeAtlas();
        initializeGPU();
        state.loading = false;
      } catch (error) {
        fallback(error);
      }
    });
  }
  stage.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || state.paused || motion.matches) return;
    const r = stage.getBoundingClientRect();
    targetX = (event.clientX - r.left) / r.width - 0.5;
    targetY = (event.clientY - r.top) / r.height - 0.5;
  }, { passive: true });
  stage.addEventListener("pointerleave", () => {
    targetX = targetY = 0;
  });
  const scheduleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  };
  new ResizeObserver(scheduleResize).observe(stage);
  window.addEventListener("resize", scheduleResize);
  new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
    state.visibilityRatio = entry.intersectionRatio;
    if (state.visible) initialize("visible");
    sync();
  }, { threshold: [0, 0.01, 0.25, 0.5, 1] }).observe(stage);
  preload = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) initialize();
  }, { rootMargin: "1200px 0px" });
  preload.observe(stage);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state.renderer === "pending") {
      const r = stage.getBoundingClientRect();
      if (r.top < innerHeight + 1200 && r.bottom > -1200) initialize();
    }
    sync();
  });
  motion.addEventListener("change", () => {
    state.paused = motion.matches;
    targetX = targetY = mouseX = mouseY = 0;
    state.frameTimes = [];
    draw();
    sync();
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    if (state.renderer === "fallback") return;
    state.lost = true;
    canvas.style.visibility = "hidden";
    preview.hidden = false;
    drawPreview();
    sync();
  });
  canvas.addEventListener("webglcontextrestored", () => {
    if (state.renderer === "fallback") return;
    state.lost = false;
    wordVao = streakVao = wordBuffer = streakBuffer = surfaceVao = surfaceBuffer = surfaceIndex = targets = null;
    state.frameTimes = [];
    try {
      initializeGPU();
    } catch (error) {
      fallback(error);
    }
  });
  window.__maccFooterField = {
    getState: () => ({
      ...state,
      frameTimes: void 0,
      animating: Boolean(state.frame),
      cameraX: mouseX,
      cameraY: mouseY,
      buffer: [canvas.width, canvas.height],
      p95: state.frameTimes.length ? [...state.frameTimes].sort((a, b) => a - b)[Math.floor(state.frameTimes.length * 0.95)] : null
    }),
    // Synchronous drawing supports pixel inspection without retaining the GPU buffer.
    renderAt: (time) => {
      state.time = time;
      draw();
    },
    resume: () => {
      state.paused = motion.matches;
      sync();
    }
  };
  stage.dataset.footerRenderer = "pending";
  resize();
  sync();
}
export {
  bindFooterField
};
