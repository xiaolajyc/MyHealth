const DB="myHealthSimple",VER=1,STORES=["healthEvents","medications","medicationLogs","supplements","supplementLogs","settings"];
let dbp;
function openDB(){if(dbp)return dbp;dbp=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,VER);r.onupgradeneeded=e=>{const d=e.target.result;STORES.forEach(s=>{if(!d.objectStoreNames.contains(s))d.createObjectStore(s,{keyPath:"id"})})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return dbp}
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random();
async function put(s,v){const d=await openDB();return new Promise((ok,no)=>{const t=d.transaction(s,"readwrite");t.objectStore(s).put(v);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
async function all(s){const d=await openDB();return new Promise((ok,no)=>{const r=d.transaction(s).objectStore(s).getAll();r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function del(s,id){const d=await openDB();return new Promise((ok,no)=>{const t=d.transaction(s,"readwrite");t.objectStore(s).delete(id);t.oncomplete=ok;t.onerror=()=>no(t.error)})}
function today(){return new Date().toISOString().slice(0,10)}
async function exportData(){const o={version:2,exportedAt:new Date().toISOString()};for(const s of STORES)o[s]=await all(s);const b=new Blob([JSON.stringify(o,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`my-health-${today()}.json`;a.click();URL.revokeObjectURL(a.href)}
async function importData(file){const x=JSON.parse(await file.text());for(const s of STORES)for(const v of x[s]||[])await put(s,v)}
