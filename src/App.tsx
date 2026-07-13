import { useState, useRef, useEffect, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import * as Babel from '@babel/standalone'
import * as ManimReact from 'manim-web/react'
import { Scene, ManimScene } from 'manim-web/react'
import 'mathlive'
import './index.css'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { onInput?: (e: Event) => void };
    }
  }
}

// ─── Latex Parser ───────────────────────────────────────────────────────────
const latexToJS = (latex: string) => {
  let js = latex;
  js = js.replace(/\s/g, '');
  js = js.replace(/\\cdot/g, '*');
  js = js.replace(/\\times/g, '*');
  js = js.replace(/\\div/g, '/');
  js = js.replace(/\\pi/g, 'Math.PI');
  // Implicit multiplication: 2x -> 2*x
  js = js.replace(/(\d)([xXyYzZ])/g, '$1*$2');
  
  js = js.replace(/\\sin\\left\(([^)]+)\\right\)/g, 'Math.sin($1)');
  js = js.replace(/\\cos\\left\(([^)]+)\\right\)/g, 'Math.cos($1)');
  js = js.replace(/\\tan\\left\(([^)]+)\\right\)/g, 'Math.tan($1)');
  js = js.replace(/\\ln\\left\(([^)]+)\\right\)/g, 'Math.log($1)');
  
  js = js.replace(/\\sin\(([^)]+)\)/g, 'Math.sin($1)');
  js = js.replace(/\\cos\(([^)]+)\)/g, 'Math.cos($1)');
  js = js.replace(/\\tan\(([^)]+)\)/g, 'Math.tan($1)');
  js = js.replace(/\\ln\(([^)]+)\)/g, 'Math.log($1)');
  
  // Fractions: \frac{a}{b} -> (a)/(b)
  js = js.replace(/\\frac{([^{}]+)}{([^{}]+)}/g, '(($1)/($2))');
  
  // Roots
  js = js.replace(/\\sqrt{([^{}]+)}/g, 'Math.sqrt($1)');
  
  // Absolute
  js = js.replace(/\\left\|([^|]+)\\right\|/g, 'Math.abs($1)');
  js = js.replace(/\|([^|]+)\|/g, 'Math.abs($1)');
  
  // Exponents
  js = js.replace(/\^{([^{}]+)}/g, '**($1)');
  js = js.replace(/\^([a-zA-Z0-9])/g, '**$1');

  // e^x
  js = js.replace(/e\*\*/g, 'Math.E**');

  return js;
}


// ─── Types ──────────────────────────────────────────────────────────────────

interface LogEntry {
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  time: string
}

// ─── Preset Animations ────────────────────────────────────────────────────────

const gridStyle = `{ color: '#666666', strokeWidth: 1, opacity: 0.4 }`;

const GRAPH_PRESETS: Record<string, { label: string, generate: () => string }> = {
  cosine: {
    label: 'Kosinüs Eğrisi',
    generate: () => `// AI Generated Manim Code for Cosine Wave
const scene = await getScene();

async function drawLabel(scene, textObj, dotObj = null) {
  const bg = new SurroundingRectangle(textObj, {
    color: '#0ea5e9',
    strokeWidth: 2,
    fillColor: '#0f172a',
    fillOpacity: 0.05,
    buff: 0.15,
    cornerRadius: 0.2
  });
  if (dotObj) {
    await scene.play(new Create(dotObj), new Create(bg), new Write(textObj));
  } else {
    await scene.play(new Create(bg), new Write(textObj));
  }
}

const axes = new NumberPlane({ xRange: [-7, 7, 1], yRange: [-4, 4, 1], xLength: 10, yLength: 6, backgroundLineStyle: ${gridStyle} });
const graph = new FunctionGraph({ func: (x) => Math.cos(x), axes: axes, color: '#3b82f6' });

// Açıklamalar (MEB Müfredatı)
const title = new Text({ weight: 'bold', text: "f(x) = cos(x) Fonksiyonu", color: '#ffffff' });
title.scale(0.8);
title.moveTo([0, 3.2, 0]);

const periyotText = new Text({ weight: 'bold', text: "Periyot: 2π (Trigonometrik Fonksiyon)", color: '#a78bfa' });
periyotText.scale(0.5);
periyotText.moveTo([3.5, 2.5, 0]);

scene.add(axes);
await scene.play(new Create(axes, { runTime: 1 }));
await drawLabel(scene, title);
await scene.play(new Create(graph, { runTime: 2 }));
await drawLabel(scene, periyotText);

const p1 = axes.c2p(0, 1);
const dotMax = new Dot({ point: p1, color: '#ef4444' });
const labelMax = new Text({ weight: 'bold', text: "Maksimum (0, 1)", color: '#ef4444' });
labelMax.scale(0.4);
labelMax.nextTo(dotMax, [0, 1, 0], 0.3);

const p2 = axes.c2p(Math.PI, -1);
const dotMin = new Dot({ point: p2, color: '#ef4444' });
const labelMin = new Text({ weight: 'bold', text: "Minimum (π, -1)", color: '#ef4444' });
labelMin.scale(0.4);
labelMin.nextTo(dotMin, [0, -1, 0], 0.3);

await drawLabel(scene, labelMax, dotMax);
await drawLabel(scene, labelMin, dotMin);
`
  },

  sine: {
    label: 'Sinüs Eğrisi',
    generate: () => `// AI Generated Manim Code for Sine Wave
const scene = await getScene();

async function drawLabel(scene, textObj, dotObj = null) {
  const bg = new SurroundingRectangle(textObj, {
    color: '#0ea5e9',
    strokeWidth: 2,
    fillColor: '#0f172a',
    fillOpacity: 0.05,
    buff: 0.15,
    cornerRadius: 0.2
  });
  if (dotObj) {
    await scene.play(new Create(dotObj), new Create(bg), new Write(textObj));
  } else {
    await scene.play(new Create(bg), new Write(textObj));
  }
}

const axes = new NumberPlane({ xRange: [-7, 7, 1], yRange: [-4, 4, 1], xLength: 10, yLength: 6, backgroundLineStyle: ${gridStyle} });
const graph = new FunctionGraph({ func: (x) => Math.sin(x), axes: axes, color: '#3b82f6' });

// Açıklamalar (MEB Müfredatı)
const title = new Text({ weight: 'bold', text: "f(x) = sin(x) Fonksiyonu", color: '#ffffff' });
title.scale(0.8);
title.moveTo([0, 3.2, 0]);

const periyotText = new Text({ weight: 'bold', text: "Periyot: 2π (Trigonometrik Fonksiyon)", color: '#a78bfa' });
periyotText.scale(0.5);
periyotText.moveTo([3.5, 2.5, 0]);

scene.add(axes);
await scene.play(new Create(axes, { runTime: 1 }));
await drawLabel(scene, title);
await scene.play(new Create(graph, { runTime: 2 }));
await drawLabel(scene, periyotText);

const p1 = axes.c2p(Math.PI / 2, 1);
const dotMax = new Dot({ point: p1, color: '#ef4444' });
const labelMax = new Text({ weight: 'bold', text: "Maksimum (π/2, 1)", color: '#ef4444' });
labelMax.scale(0.4);
labelMax.nextTo(dotMax, [0, 1, 0], 0.3);

const p2 = axes.c2p(-Math.PI / 2, -1);
const dotMin = new Dot({ point: p2, color: '#ef4444' });
const labelMin = new Text({ weight: 'bold', text: "Minimum (-π/2, -1)", color: '#ef4444' });
labelMin.scale(0.4);
labelMin.nextTo(dotMin, [0, -1, 0], 0.3);

await drawLabel(scene, labelMax, dotMax);
await drawLabel(scene, labelMin, dotMin);
`
  },
  parabola: {
    label: 'Parabol',
    generate: () => `// AI Generated Manim Code for Parabola
const scene = await getScene();

async function drawLabel(scene, textObj, dotObj = null) {
  const bg = new SurroundingRectangle(textObj, {
    color: '#0ea5e9',
    strokeWidth: 2,
    fillColor: '#0f172a',
    fillOpacity: 0.05,
    buff: 0.15,
    cornerRadius: 0.2
  });
  if (dotObj) {
    await scene.play(new Create(dotObj), new Create(bg), new Write(textObj));
  } else {
    await scene.play(new Create(bg), new Write(textObj));
  }
}

const axes = new NumberPlane({ xRange: [-7, 7, 1], yRange: [-2, 8, 1], xLength: 10, yLength: 6, backgroundLineStyle: ${gridStyle} });
const graph = new FunctionGraph({ func: (x) => x * x, axes: axes, color: '#10b981' });

const title = new Text({ weight: 'bold', text: "f(x) = x² Fonksiyonu (Parabol)", color: '#ffffff' });
title.scale(0.8);
title.moveTo([0, 3.5, 0]);

scene.add(axes);
await scene.play(new Create(axes, { runTime: 1 }));
await drawLabel(scene, title);
await scene.play(new Create(graph, { runTime: 2 }));

const origin = axes.c2p(0, 0);
const dotTepe = new Dot({ point: origin, color: '#f59e0b' });
const tepeText = new Text({ weight: 'bold', text: "Tepe Noktası T(r,k) = (0,0)", color: '#f59e0b' });
tepeText.scale(0.5);
tepeText.nextTo(dotTepe, [0, -1, 0], 0.5);

await drawLabel(scene, tepeText, dotTepe);

const pt2 = axes.c2p(2, 4);
const dot2 = new Dot({ point: pt2, color: '#3b82f6' });
const pt2Text = new Text({ weight: 'bold', text: "(2, 4) Noktası", color: '#3b82f6' });
pt2Text.scale(0.4);
pt2Text.nextTo(dot2, [1, 0, 0], 0.3);

const line1 = new DashedLine({ start: axes.c2p(2,0), end: pt2, color: '#9ca3af' });
const line2 = new DashedLine({ start: axes.c2p(0,4), end: pt2, color: '#9ca3af' });

await scene.play(new Create(line1), new Create(line2));
await drawLabel(scene, pt2Text, dot2);
`
  },
  abs: {
    label: 'Mutlak Değer',
    generate: () => `// AI Generated Manim Code for Absolute Value
const scene = await getScene();

async function drawLabel(scene, textObj, dotObj = null) {
  const bg = new SurroundingRectangle(textObj, {
    color: '#0ea5e9',
    strokeWidth: 2,
    fillColor: '#0f172a',
    fillOpacity: 0.05,
    buff: 0.15,
    cornerRadius: 0.2
  });
  if (dotObj) {
    await scene.play(new Create(dotObj), new Create(bg), new Write(textObj));
  } else {
    await scene.play(new Create(bg), new Write(textObj));
  }
}

const axes = new NumberPlane({ xRange: [-7, 7, 1], yRange: [-2, 6, 1], xLength: 10, yLength: 6, backgroundLineStyle: ${gridStyle} });
const graph = new FunctionGraph({ func: (x) => Math.abs(x), axes: axes, color: '#f59e0b' });

const title = new Text({ weight: 'bold', text: "f(x) = |x| Mutlak Değer Fonksiyonu", color: '#ffffff' });
title.scale(0.8);
title.moveTo([0, 3.5, 0]);

scene.add(axes);
await scene.play(new Create(axes, { runTime: 1 }));
await drawLabel(scene, title);
await scene.play(new Create(graph, { runTime: 2 }));

const origin = axes.c2p(0, 0);
const dotTepe = new Dot({ point: origin, color: '#ef4444' });
const tepeText = new Text({ weight: 'bold', text: "Kritik Nokta (0,0)", color: '#ef4444' });
tepeText.scale(0.5);
tepeText.nextTo(dotTepe, [0, -1, 0], 0.4);

const descText = new Text({ weight: 'bold', text: "Görüntü Kümesi: [0, ∞) \\nx ekseninin altına inemez.", color: '#a78bfa' });
descText.scale(0.5);
descText.moveTo([-3, 2, 0]);

await drawLabel(scene, tepeText, dotTepe);
await drawLabel(scene, descText);
`
  },
  cuberoot: {
    label: 'Küpkök',
    generate: () => `// AI Generated Manim Code for Cube Root
const scene = await getScene();

async function drawLabel(scene, textObj, dotObj = null) {
  const bg = new SurroundingRectangle(textObj, {
    color: '#0ea5e9',
    strokeWidth: 2,
    fillColor: '#0f172a',
    fillOpacity: 0.05,
    buff: 0.15,
    cornerRadius: 0.2
  });
  if (dotObj) {
    await scene.play(new Create(dotObj), new Create(bg), new Write(textObj));
  } else {
    await scene.play(new Create(bg), new Write(textObj));
  }
}

const axes = new NumberPlane({ xRange: [-8, 8, 2], yRange: [-4, 4, 1], xLength: 10, yLength: 6, backgroundLineStyle: ${gridStyle} });
const graph = new FunctionGraph({ func: (x) => Math.cbrt(x), axes: axes, color: '#ec4899' });

const title = new Text({ weight: 'bold', text: "f(x) = ³√x Fonksiyonu", color: '#ffffff' });
title.scale(0.8);
title.moveTo([-3, 3, 0]);

scene.add(axes);
await scene.play(new Create(axes, { runTime: 1 }));
await drawLabel(scene, title);
await scene.play(new Create(graph, { runTime: 2 }));

const descText = new Text({ weight: 'bold', text: "Orijine Göre Simetriktir (Tek Fonksiyon)", color: '#3b82f6' });
descText.scale(0.5);
descText.moveTo([3, -2, 0]);

await drawLabel(scene, descText);

const p1 = axes.c2p(8, 2);
const dot1 = new Dot({ point: p1, color: '#f59e0b' });
const l1 = new Text({ weight: 'bold', text: "(8, 2)", color: '#f59e0b' });
l1.scale(0.5); l1.nextTo(dot1, [0, 1, 0], 0.3);

const p2 = axes.c2p(-8, -2);
const dot2 = new Dot({ point: p2, color: '#f59e0b' });
const l2 = new Text({ weight: 'bold', text: "(-8, -2)", color: '#f59e0b' });
l2.scale(0.5); l2.nextTo(dot2, [0, -1, 0], 0.3);

await drawLabel(scene, l1, dot1);
await drawLabel(scene, l2, dot2);
`
  },
  exp: {
    label: 'Üstel (eˣ)',
    generate: () => `// AI Generated Manim Code for Exponential
const scene = await getScene();

async function drawLabel(scene, textObj, dotObj = null) {
  const bg = new SurroundingRectangle(textObj, {
    color: '#0ea5e9',
    strokeWidth: 2,
    fillColor: '#0f172a',
    fillOpacity: 0.05,
    buff: 0.15,
    cornerRadius: 0.2
  });
  if (dotObj) {
    await scene.play(new Create(dotObj), new Create(bg), new Write(textObj));
  } else {
    await scene.play(new Create(bg), new Write(textObj));
  }
}

const axes = new NumberPlane({ xRange: [-7, 7, 1], yRange: [-2, 8, 1], xLength: 10, yLength: 6, backgroundLineStyle: ${gridStyle} });
const graph = new FunctionGraph({ func: (x) => Math.exp(x), axes: axes, color: '#8b5cf6' });

const title = new Text({ weight: 'bold', text: "f(x) = eˣ Üstel Fonksiyonu", color: '#ffffff' });
title.scale(0.8);
title.moveTo([-3, 3, 0]);

scene.add(axes);
await scene.play(new Create(axes, { runTime: 1 }));
await drawLabel(scene, title);
await scene.play(new Create(graph, { runTime: 2 }));

const p1 = axes.c2p(0, 1);
const dot1 = new Dot({ point: p1, color: '#f59e0b' });
const l1 = new Text({ weight: 'bold', text: "y eksenini kestiği nokta (0,1)", color: '#f59e0b' });
l1.scale(0.5); l1.nextTo(dot1, [1, 0, 0], 0.3);

const asymText = new Text({ weight: 'bold', text: "Yatay Asimptot: y = 0 (x ekseni)", color: '#ef4444' });
asymText.scale(0.5);
asymText.moveTo([4, 1, 0]);

await drawLabel(scene, l1, dot1);
await drawLabel(scene, asymText);
`
  },
  log: {
    label: 'Logaritma (ln)',
    generate: () => `// AI Generated Manim Code for Logarithm
const scene = await getScene();

async function drawLabel(scene, textObj, dotObj = null) {
  const bg = new SurroundingRectangle(textObj, {
    color: '#0ea5e9',
    strokeWidth: 2,
    fillColor: '#0f172a',
    fillOpacity: 0.05,
    buff: 0.15,
    cornerRadius: 0.2
  });
  if (dotObj) {
    await scene.play(new Create(dotObj), new Create(bg), new Write(textObj));
  } else {
    await scene.play(new Create(bg), new Write(textObj));
  }
}

const axes = new NumberPlane({ xRange: [-2, 10, 1], yRange: [-4, 4, 1], xLength: 10, yLength: 6, backgroundLineStyle: ${gridStyle} });
const graph = new FunctionGraph({ func: (x) => Math.log(x), axes: axes, color: '#14b8a6', xRange: [0.05, 10] });

const title = new Text({ weight: 'bold', text: "f(x) = ln(x) Logaritma Fonksiyonu", color: '#ffffff' });
title.scale(0.8);
title.moveTo([3, 3, 0]);

scene.add(axes);
await scene.play(new Create(axes, { runTime: 1 }));
await drawLabel(scene, title);
await scene.play(new Create(graph, { runTime: 2 }));

const p1 = axes.c2p(1, 0);
const dot1 = new Dot({ point: p1, color: '#f59e0b' });
const l1 = new Text({ weight: 'bold', text: "Kök (1,0)", color: '#f59e0b' });
l1.scale(0.5); l1.nextTo(dot1, [1, -1, 0], 0.3);

const asymText = new Text({ weight: 'bold', text: "Düşey Asimptot: x = 0 \\nTanım Kümesi: (0, ∞)", color: '#ef4444' });
asymText.scale(0.5);
asymText.moveTo([4, -2, 0]);

await drawLabel(scene, l1, dot1);
await drawLabel(scene, asymText);
`
  },
  rational: {
    label: 'Rasyonel (1/x)',
    generate: () => `// AI Generated Manim Code for Rational
const scene = await getScene();

async function drawLabel(scene, textObj, dotObj = null) {
  const bg = new SurroundingRectangle(textObj, {
    color: '#0ea5e9',
    strokeWidth: 2,
    fillColor: '#0f172a',
    fillOpacity: 0.05,
    buff: 0.15,
    cornerRadius: 0.2
  });
  if (dotObj) {
    await scene.play(new Create(dotObj), new Create(bg), new Write(textObj));
  } else {
    await scene.play(new Create(bg), new Write(textObj));
  }
}

const axes = new NumberPlane({ xRange: [-7, 7, 1], yRange: [-4, 4, 1], xLength: 10, yLength: 6, backgroundLineStyle: ${gridStyle} });
const graph1 = new FunctionGraph({ func: (x) => 1/x, axes: axes, color: '#f43f5e', xRange: [-7, -0.25] });
const graph2 = new FunctionGraph({ func: (x) => 1/x, axes: axes, color: '#f43f5e', xRange: [0.25, 7] });

const title = new Text({ weight: 'bold', text: "f(x) = 1/x Rasyonel Fonksiyonu", color: '#ffffff' });
title.scale(0.8);
title.moveTo([-3, 3, 0]);

scene.add(axes);
await scene.play(new Create(axes, { runTime: 1 }));
await drawLabel(scene, title);
await scene.play(new Create(graph1, { runTime: 1 }), new Create(graph2, { runTime: 1 }));

const asym1 = new Text({ weight: 'bold', text: "Düşey Asimptot: x = 0", color: '#3b82f6' });
asym1.scale(0.5); asym1.moveTo([2.5, -3, 0]);
const asym2 = new Text({ weight: 'bold', text: "Yatay Asimptot: y = 0", color: '#3b82f6' });
asym2.scale(0.5); asym2.moveTo([4, 1, 0]);

await drawLabel(scene, asym1);
await drawLabel(scene, asym2);
`
  }
}

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: 'info', message: 'Manim Studio hazır. Başlamak için görsel yükleyin.', time: now() },
  ])
  const [isPlaying, setIsPlaying] = useState(false)
  const [editorCode, setEditorCode] = useState('// Çizdirmek istediğiniz animasyon butonuna tıklayın.')
  const [runKey, setRunKey] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  
  const [cameraZoom, setCameraZoom] = useState(1)
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panModeEnabled, setPanModeEnabled] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const [customFunction, setCustomFunction] = useState('Math.sin(x) * x')
  const [isMathModalOpen, setIsMathModalOpen] = useState(false)
  const [mathLatex, setMathLatex] = useState('\\sin(x) \\cdot x')
  const mathFieldRef = useRef<any>(null)

  // UI states for non-coders
  const [showCode, setShowCode] = useState(false)
  const [aiStatus, setAiStatus] = useState<string | null>(null)

  const [selectedAnimations, setSelectedAnimations] = useState<string[]>([])

  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [autoRecord, setAutoRecord] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])

  const getFunctionAnalysis = useCallback((funcStr: string) => {
    const normalized = funcStr.replace(/\s+/g, '').toLowerCase();
    
    if (normalized.includes('sin')) {
      return {
        type: 'Trigonometrik (Sinüs) Fonksiyonu',
        animations: [
          { id: 'graph', label: 'Grafik çizimi' },
          { id: 'period', label: 'Periyot analizi' },
          { id: 'extrema', label: 'Maksimum/Minimum noktaları' }
        ]
      };
    }
    
    if (normalized.includes('cos')) {
      return {
        type: 'Trigonometrik (Kosinüs) Fonksiyonu',
        animations: [
          { id: 'graph', label: 'Grafik çizimi' },
          { id: 'period', label: 'Periyot analizi' },
          { id: 'extrema', label: 'Maksimum/Minimum noktaları' }
        ]
      };
    }

    const isSecondDegree = normalized.includes('x^2') || normalized.includes('x**2') || normalized.includes('x*x') || ((normalized.match(/x/g) || []).length >= 2 && normalized.includes('*x'));
    
    if (isSecondDegree) {
      return {
        type: 'İkinci Derece Fonksiyon (Parabol)',
        animations: [
          { id: 'graph', label: 'Grafik çizimi' },
          { id: 'coefficients', label: 'Katsayı analizi' },
          { id: 'vertex', label: 'Tepe noktası' },
          { id: 'roots', label: 'Köklerin gösterimi' },
          { id: 'symmetry', label: 'Simetri ekseni' },
          { id: 'yIntercept', label: 'y kesişimi' }
        ]
      };
    }

    return {
      type: 'Genel Fonksiyon',
      animations: [
        { id: 'graph', label: 'Grafik çizimi' },
        { id: 'yIntercept', label: 'y kesişimi' }
      ]
    };
  }, []);

  useEffect(() => {
    const analysis = getFunctionAnalysis(customFunction);
    setSelectedAnimations(analysis.animations.map(a => a.id));
  }, [customFunction, getFunctionAnalysis]);

  const fileInputRef = useRef<HTMLInputElement>(null)

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs((prev) => [...prev.slice(-49), { type, message, time: now() }])
  }, [])

  function now() {
    return new Date().toLocaleTimeString()
  }

  // ── Screenshot upload handling ──────────────────────────────────────────

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addLog('error', 'Sadece görsel formatları desteklenmektedir.')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setScreenshotUrl(url)
      
      const img = new Image()
      img.onload = () => {
        addLog('info', `Görsel oranı ayarlandı: ${(img.width / img.height).toFixed(2)}`)
      }
      img.src = url

      setAiStatus(null)
      setEditorCode('// Yeni görsel için kod oluşturulmaya hazır...')
      addLog('success', `Görsel yüklendi: ${file.name}`)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith('image/'),
      )
      if (item) {
        const file = item.getAsFile()
        if (file) handleFile(file)
      }
    },
    [addLog],
  )

  useEffect(() => {
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  // ── Flow ────────────────────────────────────────────────────────────

  const handleRunPreset = async (presetKey: string) => {
    setIsPlaying(true)
    setAiStatus('Manim Kodu Üretiliyor...')
    
    const generatedCode = GRAPH_PRESETS[presetKey].generate()
    setEditorCode(generatedCode)
    
    await new Promise((res) => setTimeout(res, 300))
    setAiStatus('Animasyon İşleniyor...')
    addLog('success', `${GRAPH_PRESETS[presetKey].label} kodu oluşturuldu. Render başlatılıyor...`)
    
    // Trigger render
    setRunKey((k) => k + 1)
  }

  const generateDynamicManimCode = (funcStr: string, checkedAnims: string[]) => {
    // Escape functions for evaluation
    let evalFunc: (x: number) => number;
    try {
      evalFunc = new Function('x', `return ${funcStr}`) as any;
      // Test evaluate
      evalFunc(0);
    } catch (e) {
      evalFunc = (x) => x; // fallback
    }

    const normalized = funcStr.replace(/\s+/g, '').toLowerCase();
    const isSecondDegree = normalized.includes('x^2') || normalized.includes('x**2') || normalized.includes('x*x') || ((normalized.match(/x/g) || []).length >= 2 && normalized.includes('*x'));
    const isTrig = normalized.includes('sin') || normalized.includes('cos');

    let code = `// AI-Powered Dynamic Manim Code
const scene = await getScene();

async function drawLabel(scene, textObj, dotObj = null) {
  const bg = new SurroundingRectangle(textObj, {
    color: '#0ea5e9',
    strokeWidth: 2,
    fillColor: '#0f172a',
    fillOpacity: 0.05,
    buff: 0.15,
    cornerRadius: 0.2
  });
  if (dotObj) {
    await scene.play(new Create(dotObj), new Create(bg), new Write(textObj));
  } else {
    await scene.play(new Create(bg), new Write(textObj));
  }
}
`;

    // 1. Eksenler
    code += `\nconst axes = new NumberPlane({ xRange: [-7, 7, 1], yRange: [-4, 4, 1], xLength: 10, yLength: 6, backgroundLineStyle: ${gridStyle} });\n`;
    code += `scene.add(axes);\nawait scene.play(new Create(axes, { runTime: 1.5 }));\n`;

    // 2. Katsayı / Fonksiyon Başlığı
    if (checkedAnims.includes('coefficients') && isSecondDegree) {
      const c = evalFunc(0);
      const f1 = evalFunc(1);
      const fm1 = evalFunc(-1);
      const a = (f1 + fm1 - 2 * c) / 2;
      const b = f1 - a - c;
      
      const labelText = `f(x) = ${a === 1 ? '' : a === -1 ? '-' : a.toFixed(1)}x² ${b >= 0 ? '+' : ''}${b.toFixed(1)}x ${c >= 0 ? '+' : ''}${c.toFixed(1)}`;
      code += `\nconst title = new Text({ weight: 'bold', text: "${labelText}", color: '#ffffff' });\ntitle.scale(0.7);\ntitle.moveTo([0, 3.2, 0]);\nawait drawLabel(scene, title);\n`;
    } else {
      code += `\nconst title = new Text({ weight: 'bold', text: "f(x) = ${mathLatex.replace(/\\/g, '\\\\')}", color: '#ffffff' });\ntitle.scale(0.7);\ntitle.moveTo([0, 3.2, 0]);\nawait drawLabel(scene, title);\n`;
    }

    // 3. Grafik Çizimi
    if (checkedAnims.includes('graph')) {
      code += `\nconst graph = new FunctionGraph({ func: (x) => ${funcStr}, axes: axes, color: '#10b981' });\n`;
      code += `await scene.play(new Create(graph, { runTime: 2 }));\n`;
    }

    // 4. Tepe Noktası (Parabol)
    if (checkedAnims.includes('vertex') && isSecondDegree) {
      const c = evalFunc(0);
      const f1 = evalFunc(1);
      const fm1 = evalFunc(-1);
      const a = (f1 + fm1 - 2 * c) / 2;
      const b = f1 - a - c;
      const r = -b / (2 * a);
      const k = evalFunc(r);

      if (!isNaN(r) && !isNaN(k) && isFinite(r) && isFinite(k)) {
        code += `\nconst pTepe = axes.c2p(${r.toFixed(2)}, ${k.toFixed(2)});\n`;
        code += `const dotTepe = new Dot({ point: pTepe, color: '#f59e0b' });\n`;
        code += `const labelTepe = new Text({ weight: 'bold', text: "Tepe Noktası T(${r.toFixed(1)}, ${k.toFixed(1)})", color: '#f59e0b' });\n`;
        code += `labelTepe.scale(0.4);\nlabelTepe.nextTo(dotTepe, [0, -1, 0], 0.3);\n`;
        code += `await drawLabel(scene, labelTepe, dotTepe);\n`;
      }
    }

    // 5. Kökler
    if (checkedAnims.includes('roots')) {
      if (isSecondDegree) {
        const c = evalFunc(0);
        const f1 = evalFunc(1);
        const fm1 = evalFunc(-1);
        const a = (f1 + fm1 - 2 * c) / 2;
        const b = f1 - a - c;
        const delta = b * b - 4 * a * c;

        if (delta > 0) {
          const x1 = (-b - Math.sqrt(delta)) / (2 * a);
          const x2 = (-b + Math.sqrt(delta)) / (2 * a);
          code += `\nconst pR1 = axes.c2p(${x1.toFixed(2)}, 0);\nconst dotR1 = new Dot({ point: pR1, color: '#ef4444' });\n`;
          code += `const labelR1 = new Text({ weight: 'bold', text: "x₁ = ${x1.toFixed(1)}", color: '#ef4444' });\nlabelR1.scale(0.4); labelR1.nextTo(dotR1, [-0.5, 1, 0], 0.3);\n`;
          code += `const pR2 = axes.c2p(${x2.toFixed(2)}, 0);\nconst dotR2 = new Dot({ point: pR2, color: '#ef4444' });\n`;
          code += `const labelR2 = new Text({ weight: 'bold', text: "x₂ = ${x2.toFixed(1)}", color: '#ef4444' });\nlabelR2.scale(0.4); labelR2.nextTo(dotR2, [0.5, 1, 0], 0.3);\n`;
          code += `await scene.play(new Create(dotR1), new Write(labelR1), new Create(dotR2), new Write(labelR2));\n`;
        } else if (Math.abs(delta) < 0.01) {
          const x0 = -b / (2 * a);
          code += `\nconst pR0 = axes.c2p(${x0.toFixed(2)}, 0);\nconst dotR0 = new Dot({ point: pR0, color: '#ef4444' });\n`;
          code += `const labelR0 = new Text({ weight: 'bold', text: "Çift Katlı Kök x₀ = ${x0.toFixed(1)}", color: '#ef4444' });\nlabelR0.scale(0.4); labelR0.nextTo(dotR0, [0, 1, 0], 0.3);\n`;
          code += `await drawLabel(scene, labelR0, dotR0);\n`;
        }
      }
    }

    // 6. Simetri ekseni (Parabol)
    if (checkedAnims.includes('symmetry') && isSecondDegree) {
      const c = evalFunc(0);
      const f1 = evalFunc(1);
      const fm1 = evalFunc(-1);
      const a = (f1 + fm1 - 2 * c) / 2;
      const b = f1 - a - c;
      const r = -b / (2 * a);

      if (!isNaN(r) && isFinite(r)) {
        code += `\nconst symLine = new DashedLine({ start: axes.c2p(${r.toFixed(2)}, -3), end: axes.c2p(${r.toFixed(2)}, 3.5), color: '#a78bfa' });\n`;
        code += `const labelSym = new Text({ weight: 'bold', text: "Simetri Ekseni x = ${r.toFixed(1)}", color: '#a78bfa' });\n`;
        code += `labelSym.scale(0.4); labelSym.moveTo([axes.c2p(${r.toFixed(2)}, 3.5)[0], axes.c2p(${r.toFixed(2)}, 3.5)[1] + 0.3, 0]);\n`;
        code += `await scene.play(new Create(symLine), new Write(labelSym));\n`;
      }
    }

    // 7. y kesişimi
    if (checkedAnims.includes('yIntercept')) {
      const yVal = evalFunc(0);
      if (!isNaN(yVal) && isFinite(yVal)) {
        code += `\nconst pY = axes.c2p(0, ${yVal.toFixed(2)});\nconst dotY = new Dot({ point: pY, color: '#3b82f6' });\n`;
        code += `const labelY = new Text({ weight: 'bold', text: "y-kesişimi (0, ${yVal.toFixed(1)})", color: '#3b82f6' });\n`;
        code += `labelY.scale(0.4); labelY.nextTo(dotY, [-1, 0, 0], 0.3);\n`;
        code += `await drawLabel(scene, labelY, dotY);\n`;
      }
    }

    // 8. Trigonometrik Ekstremumlar
    if (checkedAnims.includes('extrema') && isTrig) {
      const maxPoints = [];
      const minPoints = [];
      const step = 0.1;
      let prev = evalFunc(-Math.PI);
      let curr = evalFunc(-Math.PI + step);
      for (let x = -Math.PI + step; x <= Math.PI - step; x += step) {
        const next = evalFunc(x + step);
        if (curr > prev && curr > next && Math.abs(curr) > 0.1) {
          maxPoints.push({ x, y: curr });
        } else if (curr < prev && curr < next && Math.abs(curr) > 0.1) {
          minPoints.push({ x, y: curr });
        }
        prev = curr;
        curr = next;
      }
      
      if (maxPoints.length > 0) {
        const p = maxPoints[0];
        code += `\nconst pMax = axes.c2p(${p.x.toFixed(2)}, ${p.y.toFixed(2)});\nconst dotMax = new Dot({ point: pMax, color: '#ef4444' });\n`;
        code += `const labelMax = new Text({ weight: 'bold', text: "Maksimum (${(p.x/Math.PI).toFixed(1)}π, ${p.y.toFixed(1)})", color: '#ef4444' });\n`;
        code += `labelMax.scale(0.4); labelMax.nextTo(dotMax, [0, 1, 0], 0.3);\n`;
        code += `await drawLabel(scene, labelMax, dotMax);\n`;
      }
      if (minPoints.length > 0) {
        const p = minPoints[0];
        code += `\nconst pMin = axes.c2p(${p.x.toFixed(2)}, ${p.y.toFixed(2)});\nconst dotMin = new Dot({ point: pMin, color: '#ef4444' });\n`;
        code += `const labelMin = new Text({ weight: 'bold', text: "Minimum (${(p.x/Math.PI).toFixed(1)}π, ${p.y.toFixed(1)})", color: '#ef4444' });\n`;
        code += `labelMin.scale(0.4); labelMin.nextTo(dotMin, [0, -1, 0], 0.3);\n`;
        code += `await drawLabel(scene, labelMin, dotMin);\n`;
      }
    }

    // 9. Periyot (Trig)
    if (checkedAnims.includes('period') && isTrig) {
      code += `\nconst periyotText = new Text({ weight: 'bold', text: "Periyot: 2π (Trigonometrik Dalga)", color: '#a78bfa' });\n`;
      code += `periyotText.scale(0.5); periyotText.moveTo([3.5, 2.5, 0]);\n`;
      code += `await drawLabel(scene, periyotText);\n`;
    }

    return code;
  };

  const handleRunCustom = async () => {
    setIsPlaying(true)
    setAiStatus('Özel Fonksiyon Üretiliyor...')
    
    const code = generateDynamicManimCode(customFunction, selectedAnimations);
    setEditorCode(code)
    
    await new Promise((res) => setTimeout(res, 300))
    setAiStatus('Animasyon İşleniyor...')
    addLog('success', `Özel fonksiyon kodu oluşturuldu.`)
    
    setRunKey((k) => k + 1)
  }



  const handleRunAI = async () => {
    if (!screenshotUrl) return;

    setIsPlaying(true)
    setAiStatus('Yapay Zeka görseli inceliyor...')
    
    try {
      setAiStatus('Backend sunucusuna bağlanılıyor...')
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshotUrl })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Bilinmeyen bir hata oluştu');
      }

      const data = await response.json();
      const generatedCode = data.code;

      setEditorCode(generatedCode)
      setAiStatus('Animasyon İşleniyor...')
      addLog('success', 'Yapay zeka analizi tamamlandı. Render başlatılıyor...')
      setRunKey((k) => k + 1)
      
    } catch (error: any) {
      addLog('error', 'API Hatası: ' + (error.message || String(error)));
      alert("Hata oluştu: " + error.message);
      setIsPlaying(false)
      setAiStatus(null)
    }
  }

  // ── Recording and Exporting Functions ──────────────────────────────────────────

  const startManualRecording = () => {
    const canvas = document.querySelector('.manim-canvas-container canvas') as HTMLCanvasElement
    if (!canvas) {
      addLog('error', 'Kayıt başlatılamadı: Çizim düzlemi bulunamadı.')
      return
    }
    recordedChunksRef.current = []
    try {
      let options = { mimeType: 'video/webm;codecs=vp9' }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8' }
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' }
      }
      const stream = canvas.captureStream(30)
      const recorder = new MediaRecorder(stream, options)
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data)
        }
      }
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `manim-animation-${Date.now()}.webm`
        a.click()
        addLog('success', 'Manuel video kaydı indirildi.')
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      addLog('info', 'Manuel kayıt başlatıldı.')
    } catch (e: any) {
      addLog('error', 'Kayıt başlatılamadı: ' + e.message)
    }
  }

  const stopManualRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      addLog('info', 'Kayıt durduruldu, video oluşturuluyor...')
    }
  }

  const captureScreenshot = () => {
    const canvas = document.querySelector('.manim-canvas-container canvas') as HTMLCanvasElement
    if (!canvas) {
      addLog('error', 'Ekran görüntüsü alınamadı: Çizim düzlemi bulunamadı.')
      return
    }
    try {
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `manim-screenshot-${Date.now()}.png`
      a.click()
      addLog('success', 'Ekran görüntüsü kaydedildi.')
    } catch (e: any) {
      addLog('error', 'Ekran görüntüsü alma hatası: ' + e.message)
    }
  }

  const downloadCode = () => {
    try {
      const blob = new Blob([editorCode], { type: 'text/javascript' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `manim-code-${Date.now()}.js`
      a.click()
      addLog('success', 'JavaScript kodu indirildi.')
    } catch (e: any) {
      addLog('error', 'Kod indirme hatası: ' + e.message)
    }
  }

  // ── Run / Re-render ────────────────────────────────────────────────────

  const handleSceneReady = async (scene: Scene) => {
    addLog('success', 'Sahne başlatıldı. Kod derleniyor...')
    setIsPlaying(true)

    let autoRecorder: MediaRecorder | null = null
    const chunks: BlobPart[] = []

    if (autoRecord) {
      const canvas = document.querySelector('.manim-canvas-container canvas') as HTMLCanvasElement
      if (canvas) {
        try {
          let options = { mimeType: 'video/webm;codecs=vp9' }
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm;codecs=vp8' }
          }
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm' }
          }
          const stream = canvas.captureStream(30)
          autoRecorder = new MediaRecorder(stream, options)
          autoRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data)
          }
          autoRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `manim-animation-${Date.now()}.webm`
            a.click()
            addLog('success', 'Otomatik kayıt başarıyla indirildi.')
          }
          autoRecorder.start()
          setIsRecording(true)
          addLog('info', 'Otomatik video kaydı başlatıldı.')
        } catch (e: any) {
          addLog('error', 'Otomatik kayıt başlatılamadı: ' + e.message)
        }
      }
    }

    try {
      // Use Babel to transpile TypeScript to JavaScript
      const transpiled = Babel.transform(editorCode, {
        filename: 'dynamic.tsx',
        presets: ['typescript']
      }).code

      if (!transpiled) throw new Error("Kod derlenirken hata oluştu")

      // Expose Manim exports to the generated function
      const exportsKey = Object.keys(ManimReact)
      const exportsValues = Object.values(ManimReact)
      
      // We create an async IIFE to allow top-level await in the user code
      const runFunc = new Function(
        ...exportsKey,
        'getScene',
        `return (async () => {
          ${transpiled}
        })();`
      )

      await runFunc(...exportsValues, () => scene)
      addLog('success', 'Animasyon başarıyla tamamlandı.')
    } catch (err) {
      addLog('error', String(err))
    } finally {
      setIsPlaying(false)
      setAiStatus(null)
      if (autoRecorder && autoRecorder.state !== 'inactive') {
        autoRecorder.stop()
        setIsRecording(false)
        addLog('info', 'Otomatik kayıt sonlandırıldı.')
      }
    }
  }

  return (
    <>

      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">✨</div>
          <span className="logo-title">Magic Manim Redraw</span>
        </div>

        <div className="status-indicator">
          <span className={`status-dot ${isPlaying ? 'loading' : ''}`} />
          {isPlaying ? (aiStatus || 'İşleniyor…') : 'Hazır'}
        </div>
      </header>

      <div className="app-container">
        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <aside className="sidebar" style={{ overflowY: 'auto' }}>
          <div>
            <p className="sidebar-title">1. Görsel Yükle (İsteğe Bağlı)</p>
          </div>

          <div className="card">
            {screenshotUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="screenshot-preview-container">
                  <img src={screenshotUrl} alt="Referans görsel" />
                  <button
                    className="btn-remove-screenshot"
                    onClick={() => {
                      setScreenshotUrl(null)
                      setAiStatus(null)
                      addLog('info', 'Görsel kaldırıldı.')
                    }}
                    title="Kaldır"
                  >
                    ✕
                  </button>
                </div>
                <button 
                  className="btn" 
                  style={{ 
                    width: '100%', 
                    background: 'var(--accent-gradient)', 
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={handleRunAI}
                  disabled={isPlaying}
                >
                  ✨ Analiz Et ve Çiz
                </button>
              </div>
            ) : (
              <div
                className={`upload-zone${dragOver ? ' drag-over' : ''}`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5V18" />
                </svg>
                <p className="upload-text">Yüklemek için tıklayın ya da sürükleyin</p>
                <p className="upload-hint">Çizim alanının oranını belirler</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </div>

          {/* Standart Animations */}
          <div style={{ marginTop: '0.5rem' }}>
            <p className="sidebar-title">2. Hazır Fonksiyon Seçin</p>
          </div>
          <div className="card">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Tıklayarak animasyonu oluşturun:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {Object.entries(GRAPH_PRESETS).map(([k, v]) => (
                <button
                  key={k}
                  className="btn"
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    justifyContent: 'flex-start'
                  }}
                  onClick={() => handleRunPreset(k)}
                  disabled={isPlaying}
                >
                  ▶ {v.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <p className="sidebar-title">3. Kendi Fonksiyonunuzu Çizin</p>
          </div>
          <div className="card">
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Aşağıdaki butona tıklayarak matematiksel fonksiyonunuzu girin.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* @ts-ignore */}
              <math-field 
                read-only
                style={{ 
                  width: '100%', 
                  fontSize: '1.2rem',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  color: 'var(--text-primary)',
                  pointerEvents: 'none'
                }}
              >
                {mathLatex}
              {/* @ts-ignore */}
              </math-field>

              <button 
                onClick={() => setIsMathModalOpen(true)}
                style={{
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                ✏️ Formülü Düzenle
              </button>

              {/* Dynamic Analysis section */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '0.6rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
                marginTop: '0.25rem'
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>FONKSİYON TESPİT EDİLDİ</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: '600' }}>
                  ✓ {getFunctionAnalysis(customFunction).type}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>ÖNERİLEN ANİMASYONLAR</span>
                {getFunctionAnalysis(customFunction).animations.map(anim => (
                  <label key={anim.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedAnimations.includes(anim.id)} 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAnimations(prev => [...prev, anim.id]);
                        } else {
                          setSelectedAnimations(prev => prev.filter(id => id !== anim.id));
                        }
                      }}
                      style={{ accentColor: 'var(--accent-primary)' }} 
                    /> 
                    {anim.label}
                  </label>
                ))}
              </div>

              <button 
                onClick={() => handleRunCustom()}
                disabled={isPlaying}
                style={{
                  padding: '0.75rem',
                  background: isPlaying ? 'var(--bg-main)' : 'var(--accent-gradient)',
                  border: 'none',
                  borderRadius: '8px',
                  color: isPlaying ? 'var(--text-muted)' : 'white',
                  fontWeight: '600',
                  cursor: isPlaying ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'transform 0.2s',
                  marginTop: '0.5rem'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>▶</span> Çiz ve Oluştur
              </button>
            </div>
          </div>

          {/* Dışa Aktarma Bölümü */}
          <div style={{ marginTop: '0.5rem' }}>
            <p className="sidebar-title">4. Kaydet ve Dışa Aktar</p>
          </div>
          <div className="card" style={{ gap: '0.85rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Animasyonunuzu veya kodunuzu bilgisayarınıza kaydedin:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={autoRecord}
                  onChange={(e) => setAutoRecord(e.target.checked)}
                />
                <span>Çalıştırırken Otomatik Kaydet</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
              {isRecording && !autoRecord ? (
                <button
                  className="btn btn-danger"
                  onClick={stopManualRecording}
                  style={{ width: '100%', fontWeight: 'bold' }}
                >
                  ⏹ Kaydı Durdur (WebM)
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  onClick={startManualRecording}
                  disabled={isPlaying || isRecording}
                  style={{ width: '100%', fontWeight: 'bold' }}
                >
                  ⏺ Manuel Kayıt Başlat (WebM)
                </button>
              )}

              <button
                className="btn"
                onClick={captureScreenshot}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                📸 Ekran Görüntüsü Al (PNG)
              </button>

              <button
                className="btn"
                onClick={downloadCode}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                💾 Manim Kodunu İndir (.js)
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '1rem' }} />
          
          <button 
            className="btn" 
            onClick={() => setShowCode(!showCode)}
            style={{ alignSelf: 'flex-start' }}
          >
            {showCode ? 'Kodu Gizle' : 'Gelişmiş: Kodu Göster'}
          </button>
        </aside>

        {/* ── Main panel ────────────────────────────────────────────── */}
        <main className="main-panel">
          <div className="workspace-bar">
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Animasyon Önizleme</span>
            <div className="workspace-actions">
              {showCode && (
                <button
                  className="btn"
                  onClick={() => setRunKey(k => k + 1)}
                  disabled={isPlaying}
                  style={{ borderColor: 'var(--accent-primary)' }}
                >
                  ▶ Değişiklikleri Çalıştır
                </button>
              )}
            </div>
          </div>

          <div className="editor-preview-split" style={{ gridTemplateColumns: showCode ? '1fr 1fr' : '1fr' }}>
            
            {/* Conditional Code Editor */}
            {showCode && (
              <div className="panel-column">
                <div className="panel-header">
                  <span className="panel-title">Oluşturulan Manim Kodu</span>
                </div>
                <div className="monaco-wrapper">
                  <Editor
                    height="100%"
                    defaultLanguage="typescript"
                    value={editorCode}
                    onChange={(v) => setEditorCode(v ?? '')}
                    theme="vs-dark"
                    options={{
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', monospace",
                      minimap: { enabled: false },
                      lineNumbers: 'on',
                      wordWrap: 'on',
                    }}
                  />
                </div>
                <div className="console-panel">
                  <div className="panel-header">
                    <span className="panel-title">Sistem Günlükleri</span>
                  </div>
                  <div className="console-logs">
                    {logs.map((log, i) => (
                      <div key={i} className={`log-entry ${log.type}`}>
                        <span style={{ opacity: 0.5, marginRight: '0.5rem' }}>[{log.time}]</span>
                        {log.message}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Render Preview */}
            <div className="panel-column">
                <div 
                  className="canvas-wrapper" 
                  style={{ position: 'relative', cursor: isPanning ? 'grabbing' : (panModeEnabled ? 'grab' : 'default') }}
                  onPointerDownCapture={(e) => {
                    setIsPanning(true)
                    dragStart.current = { x: e.clientX - cameraOffset.x, y: e.clientY - cameraOffset.y }
                    e.currentTarget.setPointerCapture(e.pointerId)
                  }}
                  onPointerMoveCapture={(e) => {
                    if (isPanning) {
                      setCameraOffset({
                        x: e.clientX - dragStart.current.x,
                        y: e.clientY - dragStart.current.y
                      })
                    }
                  }}
                  onPointerUpCapture={(e) => {
                    setIsPanning(false)
                    e.currentTarget.releasePointerCapture(e.pointerId)
                  }}
                  onPointerCancelCapture={() => setIsPanning(false)}
                  onWheel={(e) => {
                    e.preventDefault();
                    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
                    setCameraZoom(z => Math.max(0.2, Math.min(5, z + zoomDelta)));
                  }}
                >
                  {isRecording && (
                    <div className="recording-indicator">
                      <span className="recording-dot" />
                      <span>KAYDEDİLİYOR</span>
                    </div>
                  )}
                  
                  <div className="manim-canvas-container" style={{
                    transition: isPanning ? 'none' : 'transform 0.3s ease',
                    transform: `translate(${cameraOffset.x}px, ${cameraOffset.y}px) scale(${cameraZoom})`,
                    transformOrigin: 'center center',
                    willChange: 'transform'
                  }}>
                  {/* Empty state when nothing has run yet */}
                  {runKey === 0 && !isPlaying ? (
                    <div style={{ color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', justifyContent: 'center', height: '100%' }}>
                      <span style={{ fontSize: '3rem' }}>🎬</span>
                      <p>Animasyonunuz burada görünecek</p>
                    </div>
                  ) : (
                    <ManimScene
                      key={runKey}
                      width={1920}
                      height={1080}
                      backgroundColor="#060c1a"
                      style={{ width: '100%', height: '100%' }}
                      onSceneReady={handleSceneReady}
                    />
                  )}
                </div>
              </div>
              
              {/* TOOLBAR */}
              <div 
                className="canvas-toolbar"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--bg-surface)',
                  borderTop: '1px solid var(--border-color)',
                  zIndex: 30
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <button onClick={() => setPanModeEnabled(p => !p)} title={panModeEnabled ? "Kaydırmayı Kapat" : "Kaydırmayı Aç (Pan)"} style={{ padding: '0.5rem 1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: (panModeEnabled || isPanning) ? 'rgba(16, 185, 129, 0.2)' : 'transparent', color: (panModeEnabled || isPanning) ? '#10b981' : 'var(--text-secondary)', border: (panModeEnabled || isPanning) ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid transparent', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}>
                    ✋ Pan 
                  </button>
                  <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 0.5rem' }}></div>
                  <button onClick={() => { setCameraZoom(1); setCameraOffset({x:0, y:0}); }} title="Sıfırla" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: '500', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color='white'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}>Sıfırla</button>
                  <button onClick={() => setCameraZoom(z => z + 0.2)} title="Yakınlaştır (Zoom In)" style={{ padding: '0.5rem 1rem', fontSize: '1rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color='white'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}>➕ Yakınlaştır</button>
                  <button onClick={() => setCameraZoom(z => Math.max(0.2, z - 0.2))} title="Uzaklaştır (Zoom Out)" style={{ padding: '0.5rem 1rem', fontSize: '1rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color='white'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}>➖ Uzaklaştır</button>
                </div>
              </div>

            </div>
            
          </div>
        </main>
      </div>

      {/* LaTeX Math Modal */}
      {isMathModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            padding: '2rem',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '600px',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>Fonksiyon Kuralını Girin</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Matematiksel fonksiyonunuzu aşağıdaki alana yazın. Klavye butonlarını kullanarak kök, üs veya trigonometrik ifadeler ekleyebilirsiniz.
            </p>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              background: 'var(--bg-main)',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>f(x) =</span>
              {/* @ts-ignore */}
              <math-field 
                ref={mathFieldRef}
                style={{ 
                  flex: 1, 
                  fontSize: '1.5rem',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)'
                }}
                onInput={(e: any) => setMathLatex(e.target.value)}
              >
                {mathLatex}
              {/* @ts-ignore */}
              </math-field>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button 
                onClick={() => setIsMathModalOpen(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                İptal
              </button>
              <button 
                onClick={() => {
                  const jsFunc = latexToJS(mathLatex);
                  setCustomFunction(jsFunc);
                  setIsMathModalOpen(false);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px var(--accent-glow)'
                }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  )
}
