import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = readFileSync(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')).toString('base64');
const worker = readFileSync(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).toString('base64');
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5"><style>body{margin:0;background:#eee;font:14px system-ui}nav{position:sticky;top:0;display:flex;align-items:center;justify-content:center;gap:12px;padding:10px;background:white;z-index:1}button{padding:8px;border:1px solid #ddd;border-radius:8px;background:white}#pages{text-align:center;padding:12px;overflow:auto}canvas{background:white;max-width:none}#status{padding:20px;text-align:center}</style></head><body><nav><button id="prev" disabled>Previous</button><span id="count">PDF</span><button id="next" disabled>Next</button><button id="minus">-</button><button id="plus">+</button></nav><div id="status">Loading document…</div><div id="pages"></div><script type="module">
const send = (type, message) => window.ReactNativeWebView?.postMessage(JSON.stringify({type,message}));
let pdfDocument, pageNumber=1, zoom=1, busy=false;
function moduleUrl(encoded) { return URL.createObjectURL(new Blob([Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))], {type:'text/javascript'})); }
try {
  const workerUrl = moduleUrl('${worker}');
  globalThis.pdfjsWorker = await import(workerUrl);
  const pdfjs = await import(moduleUrl('${pdf}'));
  async function render() {
    if(busy || !pdfDocument) return;
    busy=true;
    try {
      const page = await pdfDocument.getPage(pageNumber);
      const initial=page.getViewport({scale:1});
      const width=Math.max(200,window.innerWidth-24);
      const viewport=page.getViewport({scale:width/initial.width*zoom});
      const ratio=Math.min(window.devicePixelRatio||1,2);
      const canvas=document.createElement('canvas'); canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
      await page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[ratio,0,0,ratio,0,0]}).promise;
      document.getElementById('pages').replaceChildren(canvas);document.getElementById('status').textContent='';
      document.getElementById('count').textContent=pageNumber+' / '+pdfDocument.numPages;
      document.getElementById('prev').disabled=pageNumber===1;document.getElementById('next').disabled=pageNumber===pdfDocument.numPages;
      page.cleanup();send('rendered',String(pageNumber));
    } finally {busy=false;}
  }
  const fail=error=>{document.getElementById('status').textContent='Unable to render this PDF: '+error.message;send('error',error.message);};
  window.renderPdf = async encoded => {
    try { pdfDocument=await pdfjs.getDocument({data:Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),useSystemFonts:true,isEvalSupported:false,isImageDecoderSupported:false,useWasm:false}).promise; await render(); }
    catch(error){fail(error);}
  };
  document.getElementById('prev').onclick=()=>{if(!busy&&pageNumber>1){pageNumber--;render().catch(fail);}};
  document.getElementById('next').onclick=()=>{if(!busy&&pageNumber<pdfDocument.numPages){pageNumber++;render().catch(fail);}};
  document.getElementById('plus').onclick=()=>{if(!busy&&zoom<3){zoom+=0.25;render().catch(fail);}};
  document.getElementById('minus').onclick=()=>{if(!busy&&zoom>0.5){zoom-=0.25;render().catch(fail);}};
  send('ready');window.dispatchEvent(new Event('pdfready'));
} catch(error) {document.getElementById('status').textContent='Unable to load PDF reader';send('error',error.message);}
</script></body></html>`;
writeFileSync(new URL('../src/assets/pdf-viewer/viewer.html',import.meta.url),html);
