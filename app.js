let page="home",trend="weight";
const titles={home:"首页",record:"记录",trends:"趋势",timeline:"时间轴",me:"我的"};
const info={weight:["⚖️","体重"],exercise:["🏃","运动"],medication:["💊","药物"],supplement:["🧴","补充剂"]};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const fmt=d=>new Intl.DateTimeFormat("zh-CN",{month:"short",day:"numeric",weekday:"short"}).format(new Date(d));

document.addEventListener("click",async e=>{
 const p=e.target.closest("[data-page]");if(p){page=p.dataset.page;render();return}
 if(e.target.closest("#topAdd")){page="record";render();return}
 if(e.target.closest("[data-close]")){closeModal();return}
 const q=e.target.closest("[data-quick]");if(q)openRecord(q.dataset.quick);
 const m=e.target.closest("[data-med]");if(m)openProduct(m.dataset.kind,m.dataset.med);
 const add=e.target.closest("[data-add]");if(add)openProduct(add.dataset.add,null);
 const take=e.target.closest("[data-take]");if(take){await put(take.dataset.kind==="medication"?"medicationLogs":"supplementLogs",{id:uid(),productId:take.dataset.take,timestamp:new Date().toISOString()});render()}
 const remove=e.target.closest("[data-delete]");if(remove){await del(remove.dataset.store,remove.dataset.delete);closeModal();render()}
 if(e.target.closest("#export"))await exportData();
 if(e.target.closest("#import"))document.getElementById("fileInput").click();
 const tr=e.target.closest("[data-trend]");if(tr){trend=tr.dataset.trend;render()}
});
document.addEventListener("change",async e=>{if(e.target.id==="fileInput"){await importData(e.target.files[0]);render()}});

async function render(){
 document.getElementById("pageTitle").textContent=titles[page];
 document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 const m=document.getElementById("main");
 if(page==="home")m.innerHTML=await home();
 if(page==="record")m.innerHTML=recordPage();
 if(page==="trends")m.innerHTML=await trendsPage();
 if(page==="timeline")m.innerHTML=await timeline();
 if(page==="me")m.innerHTML=await me();
}
async function home(){
 const events=(await all("healthEvents")).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
 const meds=(await all("medications")).filter(x=>x.active!==false),sups=(await all("supplements")).filter(x=>x.active!==false);
 const w=events.filter(x=>x.type==="weight").sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];
 const ex=events.filter(x=>x.type==="exercise").sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];
 return `<section class="hero"><div class="date">${new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"long",day:"numeric",weekday:"long"}).format(new Date())}</div><h2>今天，照顾好自己。</h2><div class="muted">只记录真正有用的健康信息。</div></section>
 <div class="section-title"><h3>今日概览</h3></div><div class="grid">
 ${metric("⚖️","体重",w?`${w.value} kg`:"—",w?fmt(w.timestamp):"暂无记录")}
 ${metric("🏃","运动",ex?`${ex.duration} min`:"—",ex?ex.activity:"暂无记录")}
 </div>
 <div class="section-title"><h3>今日用药</h3><button class="link" data-page="me">管理</button></div>
 ${meds.length?meds.map(x=>productRow(x,"medication")).join(""):`<div class="empty">还没有正在使用的药物</div>`}
 <div class="section-title"><h3>今日补充剂</h3><button class="link" data-page="me">管理</button></div>
 ${sups.length?sups.map(x=>productRow(x,"supplement")).join(""):`<div class="empty">还没有正在使用的补充剂</div>`}
 <div class="section-title"><h3>最近记录</h3><button class="link" data-page="timeline">全部</button></div>
 ${events.slice(0,4).map(eventRow).join("")||`<div class="empty">还没有记录。点击 ＋ 开始。</div>`}`;
}
function metric(i,l,v,s){return `<div class="card metric"><span class="label">${i} ${l}</span><div class="value">${v}</div><div class="sub">${s}</div></div>`}
function productRow(x,k){return `<div class="row-card"><div class="row-icon">${k==="medication"?"💊":"🧴"}</div><div class="row-main"><strong>${esc(x.name)}</strong><span>${esc(x.dose)} · ${esc(x.frequency)}</span></div><span class="status">${esc((x.times||[]).join(" / "))}</span></div>`}
function eventRow(x){return `<div class="row-card"><div class="row-icon">${x.type==="weight"?"⚖️":"🏃"}</div><div class="row-main"><strong>${esc(x.title)}</strong><span>${esc(x.summary)}</span></div><span class="status">${new Date(x.timestamp).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}</span></div>`}

function recordPage(){return `<div class="section-title"><h3>记录什么？</h3><span class="muted">全部手动记录</span></div><div class="quick-grid">
 <button class="quick" data-quick="weight"><b>⚖️</b><span>体重</span></button>
 <button class="quick" data-quick="exercise"><b>🏃</b><span>运动</span></button>
 <button class="quick" data-quick="medication"><b>💊</b><span>服药</span></button>
 <button class="quick" data-quick="supplement"><b>🧴</b><span>补充剂</span></button>
 </div>`}

function openRecord(type){
 if(type==="medication"||type==="supplement"){openProduct(type);return}
 let body=`<form id="recordForm" class="form"><div class="form-row">${field("日期","date","date",today(),true)}${field("时间","time","time",new Date().toTimeString().slice(0,5),true)}</div>`;
 if(type==="weight")body+=field("体重 (kg)","value","number","68.4",true)+field("体脂率 (%)","bodyFat","number","");
 if(type==="exercise")body+=`<div class="field"><label>运动类型</label><select name="activity"><option>步行</option><option>跑步</option><option>骑行</option><option>游泳</option><option>健身</option><option>球类</option><option>其他</option></select></div>${field("持续时间 (分钟)","duration","number","30",true)}${field("距离 (km)","distance","number","")}`;
 body+=field("备注","note","textarea","")+`<div class="actions"><button class="btn">保存</button><button type="button" class="btn secondary" data-close>取消</button></div></form>`;
 showModal(type==="weight"?"记录体重":"记录运动",body);
 document.getElementById("recordForm").onsubmit=async e=>{e.preventDefault();let f=new FormData(e.target),x={id:uid(),type,timestamp:`${f.get("date")}T${f.get("time")}:00`,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
 if(type==="weight"){x.value=+f.get("value");x.bodyFat=f.get("bodyFat")?+f.get("bodyFat"):null;x.title="体重";x.summary=`${x.value} kg`}
 else{x.activity=f.get("activity");x.duration=+f.get("duration");x.distance=f.get("distance")?+f.get("distance"):null;x.title=x.activity;x.summary=`${x.duration} min${x.distance?` · ${x.distance} km`:""}`}
 x.note=f.get("note")||"";await put("healthEvents",x);closeModal();render()}
}
function field(l,n,t="text",p="",req=false){if(t==="textarea")return `<div class="field"><label>${l}</label><textarea name="${n}" placeholder="${p}"></textarea></div>`;return `<div class="field"><label>${l}</label><input name="${n}" type="${t}" placeholder="${p}" ${req?"required":""}></div>`}

function openProduct(kind,id=null){
 const med=kind==="medication",title=med?(id?"编辑药物":"添加药物"):(id?"编辑补充剂":"添加补充剂");
 showModal(title,`<form id="productForm" class="form">
 ${field("名称","name","text",med?"药物名称":"例如 Vitamin D",true)}
 <div class="form-row">${field("剂量","dose","text","例如 10 mg",true)}${field("每次用量","amount","text","例如 1 tablet")}</div>
 <div class="field"><label>频率</label><select name="frequency"><option>每日一次</option><option>每日两次</option><option>每日三次</option><option>每周一次</option><option>隔日一次</option><option>按需</option><option>自定义</option></select></div>
 <div class="form-row">${field("开始日期","startDate","date",today(),true)}${field("结束日期","endDate","date","")}</div>
 ${field("服用时间","times","text","例如 08:00 或 08:00,20:00")}${field("备注","note","textarea","")}
 <div class="actions"><button class="btn">保存</button><button type="button" class="btn secondary" data-close>取消</button></div></form>`);
 document.getElementById("productForm").onsubmit=async e=>{e.preventDefault();let f=new FormData(e.target),now=new Date().toISOString();await put(med?"medications":"supplements",{id:id||uid(),name:f.get("name"),dose:f.get("dose"),amount:f.get("amount"),frequency:f.get("frequency"),startDate:f.get("startDate"),endDate:f.get("endDate"),times:(f.get("times")||"").split(",").map(x=>x.trim()).filter(Boolean),note:f.get("note"),active:true,createdAt:now,updatedAt:now});closeModal();render()}
}

async function trendsPage(){
 const events=await all("healthEvents"),items=events.filter(x=>x.type===trend).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp)).slice(-20);
 const vals=items.map(x=>trend==="weight"?x.value:x.duration).filter(Number.isFinite),max=Math.max(...vals,1),min=Math.min(...vals,0);
 const pts=vals.map((v,i)=>`${2+(i/Math.max(vals.length-1,1))*96},${95-(v-min)/(max-min||1)*78}`).join(" ");
 return `<div class="tabs"><button class="tab ${trend==="weight"?"active":""}" data-trend="weight">⚖️ 体重</button><button class="tab ${trend==="exercise"?"active":""}" data-trend="exercise">🏃 运动</button></div>
 <div class="card"><div class="section-title"><h3>${trend==="weight"?"体重趋势":"运动趋势"}</h3><span class="pill">${vals.length} 条</span></div><div class="chart">${vals.length?`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#16877a" stroke-width="2.5" vector-effect="non-scaling-stroke"/>${vals.map((v,i)=>{let x=2+(i/Math.max(vals.length-1,1))*96,y=95-(v-min)/(max-min||1)*78;return `<circle cx="${x}" cy="${y}" r="2.2" fill="#16877a"/>`}).join("")}</svg>`:`<div class="empty">暂无数据</div>`}</div></div>`;
}
async function timeline(){
 const es=(await all("healthEvents")).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));if(!es.length)return `<div class="empty">还没有记录。</div>`;
 const g={};es.forEach(x=>(g[x.timestamp.slice(0,10)]??=[]).push(x));
 return Object.entries(g).map(([d,a])=>`<div class="timeline-date">${d}</div>${a.map(x=>`<div class="timeline-item"><div class="timeline-card"><span class="time">${new Date(x.timestamp).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}</span><strong>${x.type==="weight"?"⚖️":"🏃"} ${esc(x.title)}</strong><small>${esc(x.summary)}</small></div></div>`).join("")}`).join("");
}
async function me(){
 const meds=await all("medications"),sups=await all("supplements");
 return `<div class="section-title"><h3>药物</h3><button class="btn" style="flex:0" data-add="medication">＋ 添加</button></div>${meds.map(x=>productCard(x,"medication")).join("")||`<div class="empty">暂无药物</div>`}
 <div class="section-title"><h3>补充剂</h3><button class="btn" style="flex:0" data-add="supplement">＋ 添加</button></div>${sups.map(x=>productCard(x,"supplement")).join("")||`<div class="empty">暂无补充剂</div>`}
 <div class="section-title"><h3>数据</h3></div><div class="settings">
 <button class="setting" id="export"><b>📦 导出数据</b><span>JSON ›</span></button>
 <button class="setting" id="import"><b>📥 导入数据</b><span>JSON ›</span></button><input id="fileInput" type="file" accept=".json" hidden>
 </div>`;
}
function productCard(x,k){return `<div class="med-card"><div class="med-top"><div><h3>${k==="medication"?"💊":"🧴"} ${esc(x.name)}</h3><p>${esc(x.dose)} · ${esc(x.frequency)}</p></div><span class="pill">使用中</span></div><div class="mini-actions"><button data-med="${x.id}" data-kind="${k}">编辑</button><button data-take="${x.id}" data-kind="${k}">今日已服</button></div></div>`}
function showModal(t,b){document.getElementById("modalTitle").textContent=t;document.getElementById("modalBody").innerHTML=b;document.getElementById("modal").classList.remove("hidden")}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
(async()=>{await openDB();render()})();