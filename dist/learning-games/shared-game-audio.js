/* 莓好學習中心｜共用闖關背景音樂
 * 使用 Web Audio API 即時合成原創緊張節奏，不依賴外部音樂檔或 CDN。
 * 必須由使用者點擊開始遊戲後啟動，以符合瀏覽器自動播放限制。
 */
(() => {
  let ctx = null, master = null, source = null, enabled = true;
  function makeBuffer() {
    const bpm = 136, beat = 60 / bpm, bars = 2, duration = beat * 4 * bars;
    const rate = ctx.sampleRate, buffer = ctx.createBuffer(1, Math.ceil(rate * duration), rate);
    const data = buffer.getChannelData(0);
    function hit(at, len, fn) {
      const start = Math.floor(at * rate), count = Math.min(Math.floor(len * rate), data.length - start);
      for (let i = 0; i < count; i++) data[start + i] += fn(i / rate);
    }
    // 低音鼓與短促的節奏打擊
    for (let b = 0; b < bars * 4; b++) {
      hit(b * beat, 0.22, t => {
        const f = 95 * Math.exp(-t * 18);
        return Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 19) * 0.8;
      });
      if (b % 2 === 1) hit(b * beat + beat * 0.5, 0.07, t => (Math.random() * 2 - 1) * Math.exp(-t * 55) * 0.13);
    }
    // 緊張、規律的低音脈衝
    const notes = [55,55,65.41,73.42,55,55,82.41,73.42];
    for (let i = 0; i < 8; i++) {
      const at = i * beat * 0.5;
      hit(at, 0.19, t => (Math.sin(2*Math.PI*notes[i]*t) + 0.25*Math.sin(2*Math.PI*notes[i]*2*t)) * Math.exp(-t*10) * 0.28);
      hit(at + beat * 0.25, 0.09, t => Math.sin(2*Math.PI*notes[(i+3)%8]*2*t) * Math.exp(-t*24) * 0.08);
    }
    return buffer;
  }
  async function start() {
    if (!enabled) return;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.62;
        master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") await ctx.resume();
      if (source) return;
      source = ctx.createBufferSource();
      source.buffer = makeBuffer();
      source.loop = true;
      source.connect(master);
      source.start(0);
    } catch (e) { console.warn("背景音樂啟動失敗", e); }
  }
  function stop() {
    try { if (source) { source.stop(); source.disconnect(); source = null; } } catch (_) {}
  }
  function setEnabled(value) {
    enabled = !!value;
    if (!enabled) stop();
  }
  window.MeihaoGameAudio = { start, stop, setEnabled, get enabled(){ return enabled; } };
})();
