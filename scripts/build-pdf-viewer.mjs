import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = readFileSync(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).toString('base64');
const worker = readFileSync(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).toString('base64');
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5"><style>body{margin:0;background:#f3f3f3;font:14px system-ui}#pages{text-align:center;padding:8px}canvas{display:block;margin:0 auto 12px;background:white;max-width:100%;height:auto}#status{padding:20px;text-align:center}#toolbar{position:sticky;top:0;z-index:2;background:#343438;color:white;padding:8px 12px;display:flex;align-items:center;gap:12px}#toolbar button{background:#48484e;color:white;border:0;border-radius:6px;min-width:44px;height:40px;font-size:22px}#count{flex:1}body.preview #toolbar{display:none}body.preview{overflow:hidden}body.preview #pages{padding:0;display:flex;align-items:center;justify-content:center;height:100vh}body.preview canvas{margin:0}</style></head><body><div id="toolbar"><span id="count">PDF document</span><button id="out" aria-label="Zoom out">−</button><button id="in" aria-label="Zoom in">+</button></div><div id="status">Loading document…</div><div id="pages"></div><script type="module">
const send = (type, message) => window.ReactNativeWebView?.postMessage(JSON.stringify({type,message}));
function moduleUrl(encoded) { return URL.createObjectURL(new Blob([Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))], {type:'text/javascript'})); }
try {
  globalThis.pdfjsWorker = await import(moduleUrl('${worker}'));
  const pdfjs = await import(moduleUrl('${pdf}'));
  window.renderPdf = async (encoded, preview = true) => {
    try {
      document.body.classList.toggle('preview', preview);
      const pdfDocument = await pdfjs.getDocument({data:Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),useSystemFonts:true,isEvalSupported:false,isImageDecoderSupported:false,useWasm:false}).promise;
      const pages = document.getElementById('pages'); pages.replaceChildren();
      document.getElementById('count').textContent = pdfDocument.numPages + ' pages';
      let zoom = 1;
      const resize = delta => { zoom = Math.max(1, Math.min(3, zoom + delta)); pages.style.zoom = zoom; };
      document.getElementById('out').onclick = () => resize(-0.25);
      document.getElementById('in').onclick = () => resize(0.25);
      for(let number = 1; number <= (preview ? 1 : pdfDocument.numPages); number++) {
        const page = await pdfDocument.getPage(number);
        const initial = page.getViewport({scale:1});
        const width = Math.max(100, window.innerWidth - (preview ? 0 : 16));
        const scale = preview ? Math.min(width / initial.width, window.innerHeight / initial.height) : width / initial.width;
        const viewport = page.getViewport({scale});
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width * ratio); canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = viewport.width + 'px'; canvas.style.height = viewport.height + 'px';
        await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[ratio,0,0,ratio,0,0]}).promise;
        pages.appendChild(canvas); page.cleanup();
        document.getElementById('status').style.display='none';
        if(number===1)send('rendered',String(pdfDocument.numPages));
      }
    } catch(error) { document.getElementById('status').textContent='Unable to render PDF';send('error',error.message); }
  };
  send('ready');
  if(window.initialPdf) window.renderPdf(window.initialPdf, window.previewOnly);
} catch(error) {document.getElementById('status').textContent='Unable to load PDF reader';send('error',error.message);}
</script></body></html>`;
writeFileSync(new URL('../src/assets/pdf-viewer/viewer.html',import.meta.url),html);
