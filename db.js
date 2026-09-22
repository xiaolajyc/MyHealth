const DB="myHealthSimple",VER=3,STORES=["healthEvents","settings"];
let dbp;
function openDB(){
  if(dbp)return dbp;
  dbp=new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB,VER);
    r.onupgradeneeded=e=>{
      const d=e.target.result;
      // Keep only the stores used by the current simple health app.
      ["medications","medicationLogs","supplements","supplementLogs"].forEach(s=>{
        if(d.objectStoreNames.contains(s)) d.deleteObjectStore(s);
      });
      STORES.forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:"id"})});
    };
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
    r.onblocked=()=>console.warn("IndexedDB upgrade is blocked by another tab");
  });
  return dbp;
}
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random();
async function put(s,v){const d=await openDB();return new Promise((ok,no)=>{const t=d.transaction(s,"readwrite");t.objectStore(s).put(v);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
async function all(s){const d=await openDB();if(!d.objectStoreNames.contains(s))return [];return new Promise((ok,no)=>{const r=d.transaction(s).objectStore(s).getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function del(s,id){const d=await openDB();return new Promise((ok,no)=>{const t=d.transaction(s,"readwrite");t.objectStore(s).delete(id);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
function today(){const d=new Date(),p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
async function exportData(){const o={version:3,exportedAt:new Date().toISOString()};for(const s of STORES)o[s]=await all(s);const b=new Blob([JSON.stringify(o,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`my-health-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function importData(file){const x=JSON.parse(await file.text());for(const s of STORES)for(const v of x[s]||[])await put(s,v)}
