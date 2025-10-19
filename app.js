// === Pantalla de presentación ===
const intro = document.getElementById("intro");
const app = document.getElementById("app");
const startBtn = document.getElementById("startApp");

if (startBtn) {
  startBtn.onclick = () => {
    intro.style.display = "none";
    app.style.display = "flex";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}

// === Variables globales ===
let signals = [];
let t = [];
const N = 1000;
let selectedIndex = -1;
let fixedYRange = [-5, 5];

// === Referencias a elementos del DOM ===
const ampSlider = document.getElementById("amplitud");
const freqSlider = document.getElementById("frecuencia");
const faseSlider = document.getElementById("fase");
const periodosSlider = document.getElementById("periodos");

const ampVal = document.getElementById("ampVal");
const freqVal = document.getElementById("freqVal");
const faseVal = document.getElementById("faseVal");
const periodosVal = document.getElementById("periodosVal");

const signalSelector = document.getElementById("signalSelector");
const deleteBtn = document.getElementById("deleteSignal");

// === Controles deslizantes ===
ampSlider.oninput = () => {
  ampVal.textContent = ampSlider.value;
  if (selectedIndex >= 0) {
    signals[selectedIndex].A = parseFloat(ampSlider.value);
    drawAll();
  }
};

freqSlider.oninput = () => {
  freqVal.textContent = freqSlider.value;
  if (selectedIndex >= 0) {
    signals[selectedIndex].f = parseFloat(freqSlider.value);
    drawAll();
  }
};

faseSlider.oninput = () => {
  faseVal.textContent = faseSlider.value;
  if (selectedIndex >= 0) {
    signals[selectedIndex].phi = parseFloat(faseSlider.value);
    drawAll();
  }
};

periodosSlider.oninput = () => {
  periodosVal.textContent = periodosSlider.value;
  drawAll();
};

// === Botones ===
document.getElementById("addSignal").onclick = () => {
  const A = parseFloat(ampSlider.value);
  const f = parseFloat(freqSlider.value);
  const phi = parseFloat(faseSlider.value);
  signals.push({ A, f, phi });
  updateSignalSelector();
  selectedIndex = signals.length - 1;
  signalSelector.selectedIndex = selectedIndex;
  drawAll();
};

document.getElementById("clear").onclick = () => {
  signals = [];
  selectedIndex = -1;
  updateSignalSelector();
  drawAll();
};

deleteBtn.onclick = () => {
  if (selectedIndex < 0 || signals.length === 0) return;
  signals.splice(selectedIndex, 1);
  selectedIndex = -1;
  updateSignalSelector();
  drawAll();
};

signalSelector.onchange = () => {
  selectedIndex = signalSelector.selectedIndex;
  if (selectedIndex >= 0) {
    const s = signals[selectedIndex];
    ampSlider.value = s.A;
    freqSlider.value = s.f;
    faseSlider.value = s.phi;
    ampVal.textContent = s.A;
    freqVal.textContent = s.f;
    faseVal.textContent = s.phi.toFixed(2);
  }
};

function updateSignalSelector() {
  signalSelector.innerHTML = "";
  signals.forEach((s, i) => {
    const option = document.createElement("option");
    option.textContent = `#${i + 1}: A=${s.A}, f=${s.f}Hz, φ=${s.phi.toFixed(2)}rad`;
    signalSelector.appendChild(option);
  });
}

function drawAll() {
  if (signals.length === 0) {
    Plotly.purge("individual");
    Plotly.purge("suma");
    return;
  }

  const nPer = parseFloat(periodosSlider.value);
  const dur = nPer;
  t = Array.from({ length: N }, (_, i) => i * dur / N);

  let total = Array(N).fill(0);
  const traces = signals.map((s, idx) => {
    const y = t.map(x => s.A * Math.sin(2 * Math.PI * s.f * x + s.phi));
    total = total.map((v, i) => v + y[i]);
    return {
      x: t,
      y,
      mode: "lines",
      name: `f=${s.f}Hz`,
      line: { width: idx === selectedIndex ? 4 : 2 }
    };
  });

  const currentMaxAmp = Math.max(...signals.map(s => s.A));
  if (currentMaxAmp > Math.abs(fixedYRange[0]) || currentMaxAmp > Math.abs(fixedYRange[1])) {
    fixedYRange = [-1.2 * currentMaxAmp, 1.2 * currentMaxAmp];
  }

  Plotly.newPlot("individual", traces, {
    title: "Señales individuales",
    margin: { t: 30 },
    xaxis: { title: "Tiempo (s)" },
    yaxis: { title: "Amplitud", range: fixedYRange, fixedrange: true }
  });

  Plotly.newPlot("suma", [{
    x: t,
    y: total,
    mode: "lines",
    line: { color: "black", width: 3 },
    name: "Suma total"
  }], {
    title: "Señal resultante",
    margin: { t: 30 },
    xaxis: { title: "Tiempo (s)" },
    yaxis: { title: "Amplitud", range: fixedYRange, fixedrange: true }
  });
}

document.getElementById("animate").onclick = () => {
  if (signals.length === 0) return;

  const nPer = parseFloat(periodosSlider.value);
  const dur = nPer;
  t = Array.from({ length: N }, (_, i) => i * dur / N);

  let total = Array(N).fill(0);
  let current = [];

  function step(k) {
    if (k >= signals.length) return;
    const s = signals[k];
    const y = t.map(x => s.A * Math.sin(2 * Math.PI * s.f * x + s.phi));
    total = total.map((v, i) => v + y[i]);
    current.push({ x: t, y, mode: "lines", name: `f=${s.f}Hz` });

    Plotly.newPlot("individual", current, {
      title: "Suma progresiva",
      xaxis: { title: "Tiempo (s)" },
      yaxis: { title: "Amplitud", range: fixedYRange, fixedrange: true }
    });

    Plotly.newPlot("suma", [{
      x: t,
      y: total,
      mode: "lines",
      line: { color: "black", width: 3 }
    }], {
      xaxis: { title: "Tiempo (s)" },
      yaxis: { title: "Amplitud", range: fixedYRange, fixedrange: true }
    });

    setTimeout(() => step(k + 1), 800);
  }

  step(0);
};
