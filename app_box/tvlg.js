(function(){
  var CFG={
    url:"https://dkguyclyiicqkzrbcgha.supabase.co",
    key:"sb_publishable_L57UjG_gDDaeYSUnwlV5kw_ry958jU9",
    table:"hpbox_pilot_state",
    id:"hpbox-pilot"
  };
  var els={},state=null,updatedAt="",started=false;
  function byId(id){return document.getElementById(id);}
  function log(msg){var d=byId('debugBox'); if(d){d.innerHTML=esc(String(msg));} }
  function appendLog(msg){var d=byId('debugBox'); if(d){d.innerHTML += "<br>"+esc(String(msg));} }
  function param(name){var q=String(window.location.search||''); if(q.charAt(0)==='?') q=q.substring(1); var parts=q.split('&'); for(var i=0;i<parts.length;i++){var p=parts[i].split('='); if(decodeURIComponent(p[0]||'')===name) return decodeURIComponent((p.slice(1).join('=')||'').replace(/\+/g,' '));} return '';}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function isoDate(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
  function pad(n){return n<10?'0'+n:String(n);}
  function selectedDate(){var p=param('date'); return /^\d{4}-\d{2}-\d{2}$/.test(p)?p:isoDate(new Date());}
  function addDays(date,days){var d=new Date(date+'T12:00:00'); d.setDate(d.getDate()+days); return isoDate(d);}
  function monday(date){var d=new Date(date+'T12:00:00'); var day=d.getDay(); var off=day===0?-6:1-day; d.setDate(d.getDate()+off); return isoDate(d);}
  function formatShort(date){var d=new Date(date+'T12:00:00'); return pad(d.getDate())+'/'+pad(d.getMonth()+1);}
  function formatLong(date){var days=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']; var months=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']; var d=new Date(date+'T12:00:00'); return days[d.getDay()]+', '+d.getDate()+' de '+months[d.getMonth()];}
  function timeNow(){var d=new Date(); return pad(d.getHours())+':'+pad(d.getMinutes());}
  function init(){
    els={days:byId('days'),modeLabel:byId('modeLabel'),title:byId('title'),dateLine:byId('dateLine'),sections:byId('sections'),scores:byId('scores'),feed:byId('feed'),pinBox:byId('pinBox'),sidePanel:byId('sidePanel'),updated:byId('updated')};
    if(param('debug')==='1') document.body.className += ' debug';
    renderDays();
    log('JS OK v12 · '+timeNow()+' · a pedir Supabase...');
    loadState();
    setInterval(function(){ if(state){ renderPin(); } },30000);
  }
  function renderDays(){
    var sel=selectedDate(), mon=monday(sel), today=isoDate(new Date()), html='', names=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
    for(var i=0;i<7;i++){var d=addDays(mon,i); var cls='day'; if(d===sel) cls+=' active'; if(d===today) cls+=' today'; html+='<a class="'+cls+'" href="?date='+d+(param('debug')==='1'?'&debug=1':'')+'"><span>'+names[i]+'</span><strong>'+formatShort(d)+'</strong></a>';}
    els.days.innerHTML=html;
  }
  function loadState(){
    /* Não meter cache-buster como &_lg=... no Supabase REST: isso vira filtro de coluna e dá HTTP 400 na LG. */
    var url=CFG.url.replace(/\/$/,'')+'/rest/v1/'+encodeURIComponent(CFG.table)+'?select=payload,updated_at&id=eq.'+encodeURIComponent(CFG.id)+'&limit=1';
    try{
      var xhr=new XMLHttpRequest();
      var done=false;
      var timer=setTimeout(function(){ if(done) return; done=true; try{xhr.abort();}catch(e){} showError('Tempo limite ao ligar ao Supabase.\nA TV abriu a página, mas não recebeu dados em 15 segundos.');},15000);
      xhr.onreadystatechange=function(){
        if(xhr.readyState!==4 || done) return;
        done=true; clearTimeout(timer);
        appendLog('HTTP '+xhr.status+' · resposta '+String(xhr.responseText||'').length+' chars');
        if(xhr.status<200 || xhr.status>=300){ showError('Erro Supabase HTTP '+xhr.status+'\n'+String(xhr.responseText||'').slice(0,500)); return; }
        try{
          var rows=JSON.parse(xhr.responseText||'[]');
          if(!rows || !rows.length || !rows[0].payload){ showError('Supabase respondeu, mas sem payload.\nResposta: '+String(xhr.responseText||'').slice(0,500)); return; }
          state=normalize(rows[0].payload);
          updatedAt=rows[0].updated_at||'';
          appendLog('OK · workouts '+state.workouts.length+' · hyrox '+state.hyroxWorkouts.length+' · classes '+state.classes.length+' · results '+state.results.length);
          renderAll();
        }catch(e){ showError('Erro a ler JSON/payload.\n'+(e.message||e)); }
      };
      xhr.open('GET',url,true);
      xhr.setRequestHeader('apikey',CFG.key);
      xhr.setRequestHeader('Authorization','Bearer '+CFG.key);
      xhr.setRequestHeader('Accept','application/json');
      try{xhr.setRequestHeader('Cache-Control','no-cache');}catch(e){}
      xhr.send(null);
    }catch(e){ showError('Erro JavaScript/XHR.\n'+(e.message||e)); }
  }
  function normalize(raw){
    raw=raw||{};
    return {workouts:arr(raw.workouts), hyroxWorkouts:arr(raw.hyroxWorkouts||raw.hyroxSessions), classes:arr(raw.classes), results:arr(raw.results||raw.workoutResults||raw.scores), feed:arr(raw.feed||raw.activityFeed), users:arr(raw.users)};
  }
  function arr(v){return Object.prototype.toString.call(v)==='[object Array]'?v:[];}
  function findByDate(list,date){for(var i=0;i<list.length;i++){ if(String(list[i].date||list[i].workoutDate||'').slice(0,10)===date) return list[i]; } return null;}
  function classType(c){var raw=String((c&&(c.classType||c.type||c.kind||c.title||c.name||c.label))||'cross').toLowerCase(); return raw.indexOf('hyrox')>=0?'hyrox':'cross';}
  function minutes(t){var m=String(t||'').match(/(\d{1,2}):(\d{2})/); if(!m) return NaN; return Number(m[1])*60+Number(m[2]);}
  function activeClass(date){
    var now=new Date(), today=isoDate(now); if(date!==today) return null;
    var current=now.getHours()*60+now.getMinutes(); var best=null;
    for(var i=0;i<state.classes.length;i++){var c=state.classes[i]; if(String(c.date||'').slice(0,10)!==date || c.ended) continue; var s=minutes(c.time||c.startTime); var e=minutes(c.endTime||c.end); if(isNaN(e)) e=s+Number(c.duration||60); if(!isNaN(s) && current>=s && current<e) best=c;}
    return best;
  }
  function renderAll(){
    var date=selectedDate(); var ac=activeClass(date); var forced=String(param('force')||'').toLowerCase(); var hyrox=findByDate(state.hyroxWorkouts,date); var workout=findByDate(state.workouts,date); var mode='cross';
    if(forced==='hyrox') mode='hyrox'; else if(forced==='cross') mode='cross'; else if(ac && classType(ac)==='hyrox') mode='hyrox'; else if(!workout && hyrox) mode='hyrox';
    document.body.className = (param('debug')==='1'?'debug ':'') + (mode==='hyrox'?'hyrox':'');
    els.modeLabel.innerHTML=mode==='hyrox'?'HYROX':'HPBOX TV LG';
    els.title.innerHTML=mode==='hyrox'?esc((hyrox&&hyrox.title)||'HYROX'):esc((workout&&workout.title)||'Treino de hoje');
    els.dateLine.innerHTML=esc(formatLong(date)+(ac?' · '+(ac.time||'')+'-'+(ac.endTime||''):'')+' · '+timeNow());
    if(mode==='hyrox') renderHyrox(hyrox,date); else renderCross(workout,date);
    renderCommunity(workout,date); renderPin();
    els.updated.innerHTML='Última atualização: '+(updatedAt?timeNowFromIso(updatedAt):timeNow());
  }
  function firstText(){
    for(var i=0;i<arguments.length;i++){var t=textFrom(arguments[i]); if(t) return t;}
    return '';
  }
  function textFrom(v){
    if(v==null) return '';
    if(typeof v==='string' || typeof v==='number') return clean(v);
    if(arr(v)){var out=[]; for(var i=0;i<v.length;i++){var t=textFrom(v[i]); if(t) out.push(t);} return clean(out.join('\n'));}
    if(typeof v==='object') return firstText(v.content,v.body,v.text,v.description,v.details,v.value,v.work,v.exercises);
    return '';
  }
  function blockContent(w,kind){
    w=w||{}; var b=w.blocks||{};
    if(kind==='warmup') return firstText(b.warmup,b.warmUp,b.aquecimento,w.warmup,w.warmUp,w.aquecimento);
    if(kind==='strength') return firstText(b.strength,b.forca,b['força'],b.skill,w.strength,w.forca,w['força'],w.skill);
    return firstText(b.metcon,b.wod,b.workout,w.metcon,w.wod,w.workout);
  }
  function normalizeText(v){
    var s=String(v||'').toLowerCase();
    if(s.normalize) s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    return s.replace(/[–—]/g,'-').replace(/[^a-z0-9]+/g,' ').replace(/^\s+|\s+$/g,'');
  }
  function isPlaceholder(text,kind){
    var n=normalizeText(text); if(!n) return true;
    if(n.indexOf('adicionar')===0) return true;
    if(n.indexOf('sem ')===0 && (n.indexOf('programado')>=0 || n==='sem wod' || n==='sem strength' || n==='sem forca' || n==='sem skill')) return true;
    if(kind==='warmup' && (n==='warm up' || n==='warmup')) return true;
    if(kind==='strength' && (n==='strength' || n==='forca' || n==='skill')) return true;
    if(kind==='wod' && n==='wod') return true;
    return false;
  }
  function estLines(text, charsPerLine){
    var parts=clean(text).split('\n'); var total=0; var cpl=charsPerLine||24;
    for(var i=0;i<parts.length;i++){var s=String(parts[i]||''); total += s?Math.max(1,Math.ceil(s.length/cpl)):1;}
    return total;
  }
  function splitForColumns(text, charsPerLine){
    var lines=clean(text).split('\n'); var cpl=charsPerLine||24; var total=estLines(text,cpl); var target=Math.ceil(total/2);
    var left=[], right=[], acc=0, toLeft=true;
    for(var i=0;i<lines.length;i++){var s=String(lines[i]||''); var units=s?Math.max(1,Math.ceil(s.length/cpl)):1; if(toLeft && acc>=target && i<lines.length-1){toLeft=false;} if(toLeft){left.push(s); acc+=units;} else {right.push(s);}}
    if(!right.length){var cut=Math.ceil(lines.length/2); left=lines.slice(0,cut); right=lines.slice(cut);}
    return {left:left.join('\n'), right:right.join('\n')};
  }
  function blockHtml(kind,text){
    var t=clean(text); var chars=kind==='wod'?18:20; var threshold=kind==='wod'?10:9;
    if(estLines(t,chars)<=threshold) return '<pre>'+esc(t)+'</pre>';
    var sp=splitForColumns(t,chars);
    return '<div class="cols"><div class="col"><pre>'+esc(sp.left)+'</pre></div><div class="col"><pre>'+esc(sp.right)+'</pre></div></div>';
  }
  function renderCross(w,date){
    if(!w){ els.sections.className='sections only-wod'; els.sections.innerHTML='<div class="empty">Sem treino programado para '+esc(formatShort(date))+'.</div>'; return; }
    var warm=blockContent(w,'warmup'); var str=blockContent(w,'strength'); var wod=blockContent(w,'wod');
    if(isPlaceholder(warm,'warmup')) warm='';
    if(isPlaceholder(str,'strength')) str='';
    if(isPlaceholder(wod,'wod')) wod='';
    var cls='sections'; if(!warm) cls+=' no-warmup'; if(!str) cls+=' no-strength'; if(!wod) cls+=' no-wod'; if(wod&&!warm&&!str) cls+=' only-wod'; els.sections.className=cls;
    var html='';
    if(warm) html+='<div class="block warmup"><div class="head"></div><div class="body">'+blockHtml('warmup',warm)+'</div></div>';
    if(str) html+='<div class="block strength"><div class="head"></div><div class="body">'+blockHtml('strength',str)+'</div></div>';
    if(wod) html+='<div class="block wod"><div class="head"></div><div class="body">'+blockHtml('wod',wod)+'</div></div>';
    if(!html) html='<div class="empty">Treino criado, mas sem blocos para mostrar.</div>';
    els.sections.innerHTML=html;
    appendLog('blocos · warm '+warm.length+' · strength '+str.length+' · wod '+wod.length);
  }
  function renderHyrox(h,date){
    var blocks=arr(h&&h.blocks); var publicBlocks=[]; for(var i=0;i<blocks.length;i++){var t=String(blocks[i].type||'').toLowerCase(); if(t!=='coach_notes' && clean(blocks[i].content||blocks[i].body||blocks[i].text||'')) publicBlocks.push(blocks[i]);}
    els.sections.className='sections hyrox-sections';
    if(!publicBlocks.length){ els.sections.innerHTML='<div class="empty">Sem HYROX público para '+esc(formatShort(date))+'.</div>'; return; }
    var html='';
    for(var j=0;j<publicBlocks.length && j<6;j++){var b=publicBlocks[j]; var title=b.title||labelBlock(b.type)||('Part '+(j+1)); var content=clean(b.content||b.body||b.text||''); html+='<div class="hyroxblock"><span class="type">'+esc(labelBlock(b.type))+'</span><h3>'+esc(title)+'</h3><pre>'+esc(content)+'</pre></div>';}
    els.sections.innerHTML=html;
  }
  function labelBlock(t){t=String(t||'part').toLowerCase(); if(t==='warmup') return 'Warm Up'; if(t==='finisher') return 'Finisher'; if(t==='cooldown') return 'Cooldown'; return 'Part';}
  function clean(v){return String(v||'').replace(/\r\n/g,'\n').replace(/^\s+|\s+$/g,'');}
  function userName(id){for(var i=0;i<state.users.length;i++){if(String(state.users[i].id||'')===String(id||'')) return state.users[i].name||'Atleta';} return 'Atleta';}
  function scoreOf(r){var vals=[r.metconScore,r.wodScore,r.score,r.resultScore,r.finalScore]; if(r.metcon){vals.push(r.metcon.score); vals.push(r.metcon.result);} if(r.wod){vals.push(r.wod.score); vals.push(r.wod.result);} for(var i=0;i<vals.length;i++){if(vals[i]!=null && String(vals[i]).replace(/\s/g,'')!=='') return String(vals[i]);} return '';}
  function resultDate(r){return String(r.workoutDate||r.date||r.createdAt||r.updatedAt||'').slice(0,10);}
  function renderCommunity(w,date){
    var rows=[]; for(var i=0;i<state.results.length;i++){var r=state.results[i]; var sc=scoreOf(r); if(sc && (!date || resultDate(r)===date || String(r.workoutId||'')===String(w&&w.id||''))) rows.push(r);} rows=rows.slice(0,3);
    var h=''; if(!rows.length) h='<div class="row">Sem resultados WOD.</div>'; else for(var j=0;j<rows.length;j++){h+='<div class="row"><span class="score">'+esc(scoreOf(rows[j]))+'</span>'+esc(userName(rows[j].userId||rows[j].athleteId)||rows[j].userName||'Atleta')+'<small>Resultado</small></div>';}
    if(els.scores) els.scores.innerHTML=h;
    if(els.feed){var f=state.feed.slice(0,3); h=''; if(!f.length) h='<div class="row">Sem atividade recente.</div>'; else for(var k=0;k<f.length;k++){h+='<div class="row">'+esc(userName(f[k].userId)||f[k].userName||'Atleta')+'<small>'+esc(String(f[k].text||f[k].description||f[k].message||'Registou atividade.').slice(0,80))+'</small></div>';} els.feed.innerHTML=h;}
  }
  function renderPin(){
    if(!state){return;} var date=selectedDate(); var ac=activeClass(date); if(!ac){ if(els.pinBox) els.pinBox.style.display='none'; if(els.sidePanel) els.sidePanel.className='side'; return; } var code=String(ac.accessCode||'').replace(/\D/g,''); if(!code){ if(els.pinBox) els.pinBox.style.display='none'; if(els.sidePanel) els.sidePanel.className='side'; return; } if(els.sidePanel) els.sidePanel.className='side has-pin'; els.pinBox.style.display='block'; els.pinBox.innerHTML='<span class="kicker">PIN da aula</span><h2 style="font-size:44px;color:#ffd36a;letter-spacing:4px;margin:6px 0">'+esc(code)+'</h2><div class="row">'+esc((ac.time||'')+'-'+(ac.endTime||''))+'</div>';
  }
  function timeNowFromIso(v){var d=new Date(v); if(isNaN(d.getTime())) return '--'; return pad(d.getHours())+':'+pad(d.getMinutes());}
  function showError(msg){ els.title.innerHTML='Erro ao carregar TV'; els.dateLine.innerHTML='Vê o quadro amarelo em baixo'; els.sections.className='sections only-wod'; els.sections.innerHTML='<div class="errorbox">'+esc(msg)+'</div>'; if(els.scores) els.scores.innerHTML='<div class="row">Sem dados.</div>'; if(els.feed) els.feed.innerHTML='<div class="row">Sem dados.</div>'; appendLog('ERRO: '+msg); }
  function boot(){ if(started) return; started=true; init(); }
  if(document.body) { setTimeout(boot,1); }
  else if(window.addEventListener) window.addEventListener('load',boot,false);
  else window.onload=boot;
})();
