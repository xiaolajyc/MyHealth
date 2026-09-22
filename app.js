let page="home", trendMetric="weight", trendRange="30D";
const titles={home:"首页",record:"记录",trends:"趋势",timeline:"时间轴",me:"我的"};
const icons={sleep:"😴",steps:"👟",heart_rate:"❤️",weight:"⚖️",blood_pressure:"🩸",exercise:"🏃",medication:"💊",supplement:"🧴",glucose:"🧪",temperature:"🌡️",meal:"🍽️",medical:"🏥"};

document.addEventListener("click",async e=>{
  const nav=e.target.closest("[data-page]");
  if(nav){page=nav.dataset.page;render();return}
  if(e.target.closest("#quickAddTop")){page="record";render();return}
  if(e.target.closest("[data-close-modal]")){closeModal();return}
  const q=e.target.closest("[data-quick]");
  if(q)openRecord(q.dataset.quick);
  const trend=e.target.closest("[data-trend]");
  if(trend){trendMetric=trend.dataset.trend;render();return}
  const range=e.target.closest("[data-range]");
  if(range){trendRange=range.dataset.range;render();return}
  const med=e.target.closest("[data-med]");
  if(med)openProduct("medication",med.dataset.med);
  const sup=e.target.closest("[data-sup]");
  if(sup)openProduct("supplement",sup.dataset.sup);
  const add=e.target.closest("[data-add-product]");
  if(add)openProduct(add.dataset.addProduct,null);
  const taken=e.target.closest("[data-taken]");
  if(taken)await markTaken(taken.dataset.taken,taken.dataset.kind);
  const del=e.target.closest("[data-delete]");
  if(del){await remove(del.dataset.delete,del.dataset.id);closeModal();render()}
  if(e.target.closest("#exportBtn"))await exportData();
  if(e.target.closest("#importInput")){}
});

async function render(){
  document.getElementById("pageTitle").textContent=titles[page];
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const main=document.getElementById("main");
  if(page==="home")main.innerHTML=await home();
  if(page==="record")main.innerHTML=recordPage();
  if(page==="trends")main.innerHTML=await trendsPage();
  if(page==="timeline")main.innerHTML=await timelinePage();
  if(page==="me")main.innerHTML=await mePage();
}
function dateLabel(){return new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"long",day:"numeric",weekday:"long"}).format(new Date())}
async function home(){
  const events=(await getAll("healthEvents")).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).slice(0,5);
  const meds=await getAll("medications"),sups=await getAll("supplements");
  return `<section class="hero"><div class="date">${dateLabel()}</div><h2>今天，照顾好自己。</h2><div class="muted">你的健康数据会在这里汇总。</div></section>
  <div class="section-title"><h3>今日概览</h3><span class="pill">本地数据</span></div>
  <div class="grid">
    ${metric("😴","睡眠","—","等待健康平台数据")}
    ${metric("👟","步数","—","等待健康平台数据")}
    ${metric("❤️","心率","—","等待健康平台数据")}
    ${metric("⚖️","体重","—","暂无记录")}
    ${metric("🩸","血压","—","暂无记录")}
    ${metric("🏃","运动","—","暂无记录")}
  </div>
  <div class="section-title"><h3>今日用药</h3><button class="link" data-page="me">管理</button></div>
  ${meds.length?meds.filter(x=>x.active).map(x=>productRow(x,"medication")).join(""):`<div class="list-empty">还没有正在使用的药物</div>`}
  <div class="section-title"><h3>今日补充剂</h3><button class="link" data-page="me">管理</button></div>
  ${sups.length?sups.filter(x=>x.active).map(x=>productRow(x,"supplement")).join(""):`<div class="list-empty">还没有正在使用的补充剂</div>`}
  <div class="section-title"><h3>最近记录</h3><button class="link" data-page="timeline">查看全部</button></div>
  ${events.length?events.map(eventRow).join(""):`<div class="list-empty">还没有记录。点击右上角 ＋ 开始添加。</div>`}`;
}
function metric(icon,label,value,sub){return `<div class="card metric"><div><span class="emoji">${icon}</span><span class="label"> ${label}</span></div><div class="value">${value}</div><div class="sub">${sub}</div></div>`}
function productRow(x,kind){return `<div class="row-card"><div class="row-icon">${kind==="medication"?"💊":"🧴"}</div><div class="row-main"><strong>${esc(x.name)}</strong><span>${esc(x.dose||"")} · ${esc(x.frequency||"")}</span></div><span class="status">${(x.times||[]).join(" / ")}</span></div>`}
function eventRow(x){return `<div class="row-card"><div class="row-icon">${icons[x.type]||"•"}</div><div class="row-main"><strong>${esc(x.title||typeName(x.type))}</strong><span>${esc(x.summary||"")}</span></div><span class="status">${new Date(x.timestamp).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}</span></div>`}
function typeName(t){return ({weight:"体重",blood_pressure:"血压",glucose:"血糖",temperature:"体温",exercise:"运动",meal:"饮食",medical:"医疗记录"})[t]||t}
function recordPage(){
  const items=[["weight","⚖️","体重"],["blood_pressure","🩸","血压"],["glucose","🧪","血糖"],["temperature","🌡️","体温"],["exercise","🏃","运动"],["meal","🍽️","饮食"],["medication","💊","药物"],["supplement","🧴","补充剂"],["medical","🏥","医疗"]];
  return `<div class="section-title"><h3>快速记录</h3><span class="muted">保存后进入时间轴</span></div><div class="quick-grid">${items.map(x=>`<button class="quick" data-quick="${x[0]}"><b>${x[1]}</b><span>${x[2]}</span></button>`).join("")}</div>
  <div class="section-title"><h3>自动数据</h3></div><div class="card"><strong>健康平台</strong><p class="muted">睡眠、步数、心率等自动数据接口已预留。当前版本先使用本地记录，后续接入 Apple Health / Health Connect。</p><span class="pill">接口预留</span></div>`;
}
function formField(label,name,type="text",placeholder="",required=false){return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" placeholder="${placeholder}" ${required?"required":""}></div>`}
function openRecord(type){
  const names={weight:"体重",blood_pressure:"血压",glucose:"血糖",temperature:"体温",exercise:"运动",meal:"饮食",medical:"医疗记录"};
  if(type==="medication"||type==="supplement"){openProduct(type,null);return}
  let fields=`<div class="form-row">${formField("日期","date","date",today(),true)}${formField("时间","time","time",new Date().toTimeString().slice(0,5),true)}</div>`;
  if(type==="weight")fields+=formField("体重 (kg)","value","number","68.4",true)+formField("体脂率 (%)","bodyFat","number");
  if(type==="blood_pressure")fields+=`<div class="form-row">${formField("收缩压 (mmHg)","systolic","number","118",true)}${formField("舒张压 (mmHg)","diastolic","number","76",true)}</div>${formField("心率 (bpm)","heartRate","number","67")}`;
  if(type==="glucose")fields+=formField("血糖 (mmol/L)","value","number","5.2",true)+`<div class="field"><label>测量场景</label><select name="context"><option>空腹</option><option>早餐后</option><option>午餐后</option><option>晚餐后</option><option>睡前</option><option>其他</option></select></div>`;
  if(type==="temperature")fields+=formField("体温 (°C)","value","number","36.5",true);
  if(type==="exercise")fields+=`<div class="field"><label>类型</label><select name="activity"><option>步行</option><option>跑步</option><option>骑行</option><option>游泳</option><option>健身</option><option>球类</option><option>其他</option></select></div>${formField("持续时间 (分钟)","duration","number","30",true)}${formField("距离 (km)","distance","number","")}`;
  if(type==="meal")fields+=`<div class="field"><label>餐次</label><select name="mealType"><option>早餐</option><option>午餐</option><option>晚餐</option><option>加餐</option><option>其他</option></select></div>${formField("食物名称","food","text","例如：牛奶、燕麦、鸡蛋",true)}${formField("热量 (kcal)","calories","number","")}`;
  if(type==="medical")fields+=formField("标题","title","text","例如：GP Consultation",true)+formField("机构","provider","text","")+`<div class="field"><label>内容</label><textarea name="content"></textarea></div>`;
  fields+=`<div class="field"><label>备注</label><textarea name="note"></textarea></div>`;
  showModal(names[type],`<form id="recordForm" class="form">${fields}<div class="actions"><button class="btn" type="submit">保存记录</button><button class="btn secondary" type="button" data-close-modal>取消</button></div></form>`);
  document.getElementById("recordForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const dt=`${f.get("date")}T${f.get("time")}:00`;let x={id:uid(),type,timestamp:dt,source:"manual",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),note:f.get("note")||""};
    if(type==="weight"){x.value=+f.get("value");x.unit="kg";x.title="体重";x.summary=`${x.value} kg`}
    if(type==="blood_pressure"){x.systolic=+f.get("systolic");x.diastolic=+f.get("diastolic");x.heartRate=f.get("heartRate")?+f.get("heartRate"):null;x.title="血压";x.summary=`${x.systolic}/${x.diastolic} mmHg`}
    if(type==="glucose"){x.value=+f.get("value");x.unit="mmol/L";x.context=f.get("context");x.title="血糖";x.summary=`${x.value} mmol/L · ${x.context}`}
    if(type==="temperature"){x.value=+f.get("value");x.unit="°C";x.title="体温";x.summary=`${x.value} °C`}
    if(type==="exercise"){x.activity=f.get("activity");x.duration=+f.get("duration");x.distance=f.get("distance")?+f.get("distance"):null;x.title=f.get("activity");x.summary=`${x.duration} min${x.distance?` · ${x.distance} km`:""}`}
    if(type==="meal"){x.mealType=f.get("mealType");x.food=f.get("food");x.calories=f.get("calories")?+f.get("calories"):null;x.title=x.mealType;x.summary=x.food}
    if(type==="medical"){x.title=f.get("title");x.provider=f.get("provider");x.content=f.get("content");x.summary=x.provider||"医疗记录"}
    await put("healthEvents",x);closeModal();render();
  };
}
function openProduct(kind,id){
  const isMed=kind==="medication", title=isMed?(id?"编辑药物":"添加药物"):(id?"编辑补充剂":"添加补充剂");
  showModal(title,`<form id="productForm" class="form">
  ${formField("名称","name","text",isMed?"药物名称":"例如 Vitamin D",true)}
  <div class="form-row">${formField("剂量","dose","text","例如 10 mg",true)}${formField("每次用量","amount","text","例如 1 tablet")}</div>
  <div class="field"><label>频率</label><select name="frequency"><option>每日一次</option><option>每日两次</option><option>每日三次</option><option>每周一次</option><option>隔日一次</option><option>按需</option><option>自定义</option></select></div>
  <div class="form-row">${formField("开始日期","startDate","date",today(),true)}${formField("结束日期","endDate","date")}</div>
  ${formField("服用时间","times","text","例如 08:00 或 08:00,20:00")}
  <div class="field"><label>备注</label><textarea name="note"></textarea></div>
  <div class="actions"><button class="btn" type="submit">保存</button><button class="btn secondary" type="button" data-close-modal>取消</button></div>
  </form>`);
  document.getElementById("productForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),now=new Date().toISOString();const x={id:id||uid(),name:f.get("name"),dose:f.get("dose"),amount:f.get("amount"),frequency:f.get("frequency"),startDate:f.get("startDate"),endDate:f.get("endDate"),times:(f.get("times")||"").split(",").map(s=>s.trim()).filter(Boolean),note:f.get("note"),active:true,createdAt:now,updatedAt:now};await put(isMed?"medications":"supplements",x);closeModal();render()}
}
async function markTaken(id,kind){const now=new Date().toISOString();await put(kind==="medication"?"medicationLogs":"supplementLogs",{id:uid(),productId:id,timestamp:now,status:"taken",source:"manual",createdAt:now,updatedAt:now});render()}
async function trendsPage(){
  const cfg={weight:["⚖️","体重","kg"],steps:["👟","步数","steps"],heart_rate:["❤️","心率","bpm"],blood_pressure:["🩸","血压","mmHg"],sleep:["😴","睡眠","h"],exercise:["🏃","运动","min"]};
  const [icon,label,unit]=cfg[trendMetric]||cfg.weight;
  const events=await getAll("healthEvents");
  const data=events.filter(x=>x.type===trendMetric).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp)).slice(-14);
  const vals=data.map(x=>trendMetric==="blood_pressure"?x.systolic:(trendMetric==="exercise"?x.duration:x.value)).filter(Number.isFinite);
  const max=Math.max(...vals,1),min=Math.min(...vals,0),pts=vals.map((v,i)=>`${(i/(Math.max(vals.length-1,1)))*96+2},${95-((v-min)/(max-min||1))*78}`).join(" ");
  const options=Object.keys(cfg).map(k=>`<button class="tab ${k===trendMetric?"active":""}" data-trend="${k}">${cfg[k][1]}</button>`).join("");
  return `<div class="tabs">${options}</div><div class="card"><div class="section-title"><h3>${icon} ${label}</h3><span class="pill">${trendRange}</span></div><div class="chart">${vals.length?`<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#16877a" stroke-width="2.5" vector-effect="non-scaling-stroke"/>${vals.map((v,i)=>{const [x,y]=[(i/(Math.max(vals.length-1,1)))*96+2,95-((v-min)/(max-min||1))*78];return `<circle cx="${x}" cy="${y}" r="2.2" fill="#16877a"/>`}).join("")}</svg>`:`<div class="list-empty">暂无 ${label} 数据</div>`}</div><div class="legend"><span>历史</span><strong>${vals.length?`${vals[vals.length-1]} ${unit}`:"—"}</strong><span>${vals.length?`${vals.length} 条记录`:"等待数据"}</span></div></div>
  <div class="tabs">${["7D","30D","3M","1Y","ALL"].map(r=>`<button class="tab ${r===trendRange?"active":""}" data-range="${r}">${r}</button>`).join("")}</div>
  <div class="section-title"><h3>统计</h3></div><div class="grid">${metric("•","最新",vals.length?`${vals[vals.length-1]} ${unit}`:"—","")} ${metric("↕","最低",vals.length?`${Math.min(...vals)} ${unit}`:"—","")} ${metric("↕","最高",vals.length?`${Math.max(...vals)} ${unit}`:"—","")}</div>`;
}
async function timelinePage(){
  const events=(await getAll("healthEvents")).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  if(!events.length)return `<div class="card list-empty">还没有健康事件。<br><br>去“记录”添加第一条数据。</div>`;
  const grouped={};events.forEach(x=>{const d=x.timestamp.slice(0,10);(grouped[d]??=[]).push(x)});
  return Object.entries(grouped).map(([d,list])=>`<div class="timeline-date">${d}</div>${list.map(x=>`<div class="timeline-item"><div class="timeline-card"><span class="time">${new Date(x.timestamp).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"})}</span><strong>${icons[x.type]||"•"} ${esc(x.title||typeName(x.type))}</strong><small>${esc(x.summary||x.note||"")}</small></div></div>`).join("")}`).join("");
}
async function mePage(){
  const meds=await getAll("medications"),sups=await getAll("supplements");
  return `<div class="section-title"><h3>健康管理</h3></div>
  <div class="settings-list">
    <button class="setting" data-page="me"><b>🎯 健康目标</b><span>›</span></button>
    <button class="setting" data-add-product="medication"><b>💊 药物管理</b><span>${meds.length} 种 ›</span></button>
    <button class="setting" data-add-product="supplement"><b>🧴 补充剂管理</b><span>${sups.length} 种 ›</span></button>
    <button class="setting" id="medicalInfo"><b>🏥 医疗记录</b><span>›</span></button>
    <button class="setting" id="labInfo"><b>🧪 检查结果</b><span>›</span></button>
    <button class="setting" id="vaccineInfo"><b>💉 疫苗</b><span>›</span></button>
  </div>
  <div class="section-title"><h3>数据</h3></div>
  <div class="settings-list">
    <button class="setting" id="exportBtn"><b>📦 导出全部数据</b><span>JSON ›</span></button>
    <label class="setting"><b>📥 导入数据</b><span>JSON ›</span><input id="importInput" type="file" accept=".json" hidden></label>
    <button class="setting" id="syncInfo"><b>☁️ Google Drive 同步</b><span>接口预留 ›</span></button>
  </div>
  <div class="section-title"><h3>正在使用</h3></div>
  <input class="search" placeholder="搜索药物或补充剂..." oninput="filterProducts(this.value)">
  <div id="productList">${meds.map(x=>productCard(x,"medication")).join("")}${sups.map(x=>productCard(x,"supplement")).join("")}</div>`;
}
function productCard(x,kind){return `<div class="med-card product-search" data-name="${esc(x.name).toLowerCase()}"><div class="med-top"><div><h3>${kind==="medication"?"💊":"🧴"} ${esc(x.name)}</h3><p>${esc(x.dose||"")} · ${esc(x.frequency||"")}</p></div><span class="pill">${x.active?"使用中":"已结束"}</span></div><div class="mini-actions"><button data-med="${x.id}" data-kind="${kind}">编辑</button><button data-taken="${x.id}" data-kind="${kind}">今日已服</button></div></div>`}
function filterProducts(v){document.querySelectorAll(".product-search").forEach(x=>x.style.display=x.dataset.name.includes(v.toLowerCase())?"":"none")}
function showModal(title,body){document.getElementById("modalTitle").textContent=title;document.getElementById("modalBody").innerHTML=body;document.getElementById("modal").classList.remove("hidden")}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
(async()=>{await openDB();await seed();render()})();