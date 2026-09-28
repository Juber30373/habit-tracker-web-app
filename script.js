(function(){
"use strict";
const KEY="habitflow_fixed_v2";
let state={habits:[]};

function todayKey(d=new Date()){
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){const x=JSON.parse(raw);if(x&&Array.isArray(x.habits))state=x;}
  }catch(e){state={habits:[]};}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
function esc(v){return String(v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function done(h,k=todayKey()){return !!(h.history&&h.history[k]);}
function toggle(id){const h=state.habits.find(x=>x.id===id);if(!h)return;if(!h.history)h.history={};const k=todayKey();h.history[k]=!h.history[k];save();render();}
function day(n){const d=new Date();d.setDate(d.getDate()-n);return d;}
function completion(k){if(!state.habits.length)return 0;return Math.round(state.habits.filter(h=>done(h,k)).length/state.habits.length*100);}
function streak(h){let n=0,d=new Date();while(done(h,todayKey(d))){n++;d.setDate(d.getDate()-1);}return n;}
function bestStreak(h){let best=0,run=0;for(let i=365;i>=0;i--){if(done(h,todayKey(day(i)))){run++;if(run>best)best=run;}else run=0;}return best;}
function icon(c){return {Study:"📚",Health:"💧",Fitness:"🏃",Personal:"🌱",Other:"✓"}[c]||"✓";}

function bars(el,count){
  el.innerHTML="";
  for(let i=count-1;i>=0;i--){
    const d=day(i),p=completion(todayKey(d));
    const label=d.toLocaleDateString(undefined,{weekday:"short"});
    el.insertAdjacentHTML("beforeend",'<div class="barwrap"><div class="bar" style="height:'+Math.max(3,p)+'%" title="'+p+'%"></div><span class="barlabel">'+label+'</span></div>');
  }
}
function render(){
  document.getElementById("todayDate").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase();
  const total=state.habits.length, completed=state.habits.filter(h=>done(h)).length, pct=total?Math.round(completed/total*100):0;
  document.getElementById("heroPercent").textContent=pct+"% complete";
  document.getElementById("ringText").textContent=pct+"%";
  document.getElementById("ring").style.background="conic-gradient(white "+(pct*3.6)+"deg,#ffffff55 0deg)";
  document.getElementById("heroMessage").textContent=total?(completed===total?"Great job — all habits complete today!":(total-completed)+" habit"+(total-completed===1?"":"s")+" left for today."):"Add a habit to get started.";
  document.getElementById("total").textContent=total;
  document.getElementById("completed").textContent=completed;
  document.getElementById("best").textContent=state.habits.reduce((m,h)=>Math.max(m,bestStreak(h)),0);
  let checks=0,entries=0;
  state.habits.forEach(h=>{const vals=Object.values(h.history||{});checks+=vals.filter(Boolean).length;entries+=vals.length;});
  document.getElementById("rate").textContent=(entries?Math.round(checks/entries*100):0)+"%";
  document.getElementById("todayList").innerHTML=total?state.habits.map(h=>'<div class="habit-row"><button class="check '+(done(h)?"done":"")+'" data-toggle="'+h.id+'">'+(done(h)?"✓":"")+'</button><div class="habit-info"><strong>'+esc(h.name)+'</strong><span>'+esc(h.category)+" · "+h.goal+' min goal</span></div><div class="streak">🔥 '+streak(h)+'</div></div>').join(""):'<div class="empty">No habits yet. Click “+ Add Habit” to create one.</div>';
  document.getElementById("habitGrid").innerHTML=total?state.habits.map(h=>'<div class="card habit-card"><div class="icon">'+icon(h.category)+'</div><h3>'+esc(h.name)+'</h3><p>'+esc(h.category)+'<br>Daily goal: '+h.goal+' minutes<br>Current streak: 🔥 '+streak(h)+' days<br>Best streak: '+bestStreak(h)+' days</p><div class="actions"><button data-edit="'+h.id+'">Edit</button><button class="del" data-delete="'+h.id+'">Delete</button></div></div>').join(""):'<div class="card empty">No habits created yet.</div>';
  bars(document.getElementById("weekChart"),7);bars(document.getElementById("progressChart"),14);
  document.getElementById("performance").innerHTML=total?state.habits.map(h=>{const v=Object.values(h.history||{}),r=v.length?Math.round(v.filter(Boolean).length/v.length*100):0;return '<div class="perf"><div class="perf-name">'+esc(h.name)+'</div><div class="track"><div class="fill" style="width:'+r+'%"></div></div><div class="value">'+r+'%</div></div>';}).join(""):'<div class="empty">Progress will appear here after you start tracking habits.</div>';
}
function showPage(page){
  document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
  const target=document.getElementById(page);if(target)target.classList.add("active");
  document.querySelectorAll(".nav button").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  document.getElementById("title").textContent=page==="dashboard"?"Today's habits":page==="habits"?"My Habits":"Progress";
}
function openModal(id){
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("form").reset();
  document.getElementById("editId").value="";
  document.getElementById("goal").value=30;
  document.getElementById("modalTitle").textContent="Add a habit";
  if(id){
    const h=state.habits.find(x=>x.id===id);if(!h)return;
    document.getElementById("editId").value=id;
    document.getElementById("name").value=h.name;
    document.getElementById("category").value=h.category;
    document.getElementById("goal").value=h.goal;
    document.getElementById("modalTitle").textContent="Edit habit";
  }
  setTimeout(()=>document.getElementById("name").focus(),50);
}
function closeModal(){document.getElementById("modal").classList.add("hidden");}
document.addEventListener("click",function(e){
  const nav=e.target.closest("[data-page]");if(nav){showPage(nav.dataset.page);return;}
  if(e.target.closest("#addTop")||e.target.closest("#addMain")){openModal();return;}
  const t=e.target.closest("[data-toggle]");if(t){toggle(Number(t.dataset.toggle));return;}
  const ed=e.target.closest("[data-edit]");if(ed){openModal(Number(ed.dataset.edit));return;}
  const del=e.target.closest("[data-delete]");if(del){const id=Number(del.dataset.delete),h=state.habits.find(x=>x.id===id);if(h&&confirm('Delete "'+h.name+'"?')){state.habits=state.habits.filter(x=>x.id!==id);save();render();}return;}
  if(e.target.id==="close"||e.target.id==="cancel"||e.target.id==="modal")closeModal();
});
document.getElementById("form").addEventListener("submit",function(e){
  e.preventDefault();
  const id=Number(document.getElementById("editId").value);
  const name=document.getElementById("name").value.trim();
  const category=document.getElementById("category").value;
  const goal=Number(document.getElementById("goal").value);
  if(!name||!goal)return;
  if(id){const h=state.habits.find(x=>x.id===id);if(h){h.name=name;h.category=category;h.goal=goal;}}
  else state.habits.push({id:Date.now(),name,category,goal,history:{}});
  save();closeModal();render();showPage("habits");
});
load();render();
})();
