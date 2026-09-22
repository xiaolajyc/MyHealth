const DB_NAME="myHealthDB", DB_VERSION=1;
const stores=["healthEvents","medications","medicationLogs","supplements","supplementLogs","goals","settings"];
let dbPromise=null;
function openDB(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const r=indexedDB.open(DB_NAME,DB_VERSION);
    r.onupgradeneeded=e=>{
      const db=e.target.result;
      stores.forEach(s=>{
        if(!db.objectStoreNames.contains(s)){
          const st=db.createObjectStore(s,{keyPath:"id"});
          if(s!=="settings"){st.createIndex("updatedAt","updatedAt");st.createIndex("timestamp","timestamp");}
        }
      });
    };
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
  return dbPromise;
}
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
async function put(store,value){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(store,"readwrite");tx.objectStore(store).put(value);tx.oncomplete=()=>res(value);tx.onerror=()=>rej(tx.error)})}
async function getAll(store){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function remove(store,id){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(store,"readwrite");tx.objectStore(store).delete(id);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}
async function seed(){
  const meds=await getAll("medications");
  if(!meds.length){
    const now=new Date().toISOString();
    await put("medications",{id:uid(),name:"示例药物 A",dose:"10 mg",frequency:"每日一次",times:["08:00"],startDate:today(),active:true,createdAt:now,updatedAt:now});
  }
  const sups=await getAll("supplements");
  if(!sups.length){
    const now=new Date().toISOString();
    await put("supplements",{id:uid(),name:"Vitamin D",dose:"1000 IU",frequency:"每日一次",times:["08:30"],startDate:today(),active:true,createdAt:now,updatedAt:now});
  }
}
function today(){return new Date().toISOString().slice(0,10)}
function fmtDate(v){return new Intl.DateTimeFormat("zh-CN",{month:"short",day:"numeric",weekday:"short"}).format(new Date(v))}
async function exportData(){
  const data={version:1,exportedAt:new Date().toISOString()};
  for(const s of stores)data[s]=await getAll(s);
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`health-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href);
}
async function importData(file){
  const text=await file.text(),data=JSON.parse(text);
  for(const s of stores)for(const x of (data[s]||[]))await put(s,x);
}