(function(){
  var CFG={
    url:"https://dkguyclyiicqkzrbcgha.supabase.co",
    key:"sb_publishable_L57UjG_gDDaeYSUnwlV5kw_ry958jU9",
    table:"hpbox_tv_public_state",
    id:"hpbox-tv-public",
    fallbackTable:"hpbox_pilot_state",
    fallbackId:"hpbox-pilot"
  };
  var PIN_GRACE_MINUTES=15;
  var els={},state=null,updatedAt="",started=false,loading=false,renderSignature="";
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
    els={days:byId('days'),modeLabel:byId('modeLabel'),title:byId('title'),dateLine:byId('dateLine'),sections:byId('sections'),scores:byId('scores'),feed:byId('feed'),pinBox:byId('pinBox'),sidePanel:byId('sidePanel'),scoreBlock:byId('scoreBlock'),updated:byId('updated')};
    if(param('debug')==='1') document.body.className += ' debug';
    renderDays();
    log('JS OK · '+timeNow()+' · a pedir Supabase...');
    loadState();
    setInterval(refreshForCurrentTime,10000);
    setInterval(loadState,30000);
  }
  function renderDays(){
    var sel=selectedDate(), mon=monday(sel), today=isoDate(new Date()), html='', names=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
    for(var i=0;i<7;i++){var d=addDays(mon,i); var cls='day'; if(d===sel) cls+=' active'; if(d===today) cls+=' today'; html+='<a class="'+cls+'" href="?date='+d+(param('debug')==='1'?'&debug=1':'')+'"><span>'+names[i]+'</span><strong>'+formatShort(d)+'</strong></a>';}
    els.days.innerHTML=html;
  }
  function requestState(table,id,callback){
    var url=CFG.url.replace(/\/$/,'')+'/rest/v1/'+encodeURIComponent(table)+'?id=eq.'+encodeURIComponent(id)+'&select=payload,updated_at&limit=1';
    try{
      var xhr=new XMLHttpRequest();
      var done=false;
      var timer=setTimeout(function(){ if(done) return; done=true; try{xhr.abort();}catch(e){} callback('Tempo limite ao ligar ao Supabase.',null);},15000);
      xhr.onreadystatechange=function(){
        if(xhr.readyState!==4 || done) return;
        done=true; clearTimeout(timer);
        if(xhr.status<200 || xhr.status>=300){ callback('Erro Supabase HTTP '+xhr.status+' · '+String(xhr.responseText||'').slice(0,300),null); return; }
        try{
          var rows=JSON.parse(xhr.responseText||'[]');
          if(!rows || !rows.length || !rows[0].payload){ callback('Supabase respondeu, mas sem payload em '+table+'.',null); return; }
          callback('',rows[0]);
        }catch(e){ callback('Erro a ler JSON/payload. '+(e.message||e),null); }
      };
      xhr.open('GET',url,true);
      xhr.setRequestHeader('apikey',CFG.key);
      xhr.setRequestHeader('Authorization','Bearer '+CFG.key);
      xhr.setRequestHeader('Accept','application/json');
      try{xhr.setRequestHeader('Cache-Control','no-cache');}catch(e){}
      xhr.send(null);
    }catch(e){ callback('Erro JavaScript/XHR. '+(e.message||e),null); }
  }
  function useStateRow(row,source){
    state=normalize(row.payload);
    updatedAt=row.updated_at||'';
    loading=false;
    appendLog('OK '+source+' · workouts '+state.workouts.length+' · hyrox '+state.hyroxWorkouts.length+' · classes '+state.classes.length+' · results '+state.results.length);
    var context=displayContext();
    if(contextSignature(context)!==renderSignature) renderAll(context);
    else renderPin();
  }
  function loadState(){
    if(loading) return;
    loading=true;
    requestState(CFG.table,CFG.id,function(primaryError,row){
      if(row){useStateRow(row,'TV pública');return;}
      requestState(CFG.fallbackTable,CFG.fallbackId,function(fallbackError,fallbackRow){
        if(fallbackRow){useStateRow(fallbackRow,'compatibilidade');return;}
        loading=false;
        var message=primaryError+'\n'+fallbackError;
        if(!state) showError(message);
        else appendLog('AVISO: '+message);
      });
    });
  }
  function normalize(raw){
    raw=raw||{};
    return {workouts:arr(raw.workouts), hyroxWorkouts:arr(raw.hyroxWorkouts||raw.hyroxSessions), classes:arr(raw.classes), results:arr(raw.results||raw.workoutResults||raw.scores), feed:arr(raw.feed||raw.activityFeed), users:arr(raw.users)};
  }
  function arr(v){return Object.prototype.toString.call(v)==='[object Array]'?v:[];}
  function findByDate(list,date){for(var i=0;i<list.length;i++){ if(String(list[i].date||list[i].workoutDate||'').slice(0,10)===date) return list[i]; } return null;}
  function classType(c){var raw=String((c&&(c.classType||c.type||c.kind||c.category||c.title||c.name||c.label))||'cross').replace(/^\s+|\s+$/g,'').toLowerCase(); return raw==='h'||raw.indexOf('hyrox')>=0?'hyrox':'cross';}
  function minutes(t){var m=String(t||'').match(/(\d{1,2}):(\d{2})/); if(!m) return NaN; return Number(m[1])*60+Number(m[2]);}
  function activeClass(date){
    var now=new Date(), today=isoDate(now); if(date!==today) return null;
    var current=now.getHours()*60+now.getMinutes(); var best=null; var bestStart=-1;
    for(var i=0;i<state.classes.length;i++){var c=state.classes[i]; if(String(c.date||c.classDate||c.class_date||'').slice(0,10)!==date) continue; var s=minutes(c.time||c.startTime||c.start_time); var e=minutes(c.endTime||c.end||c.end_time); if(isNaN(e)) e=s+Number(c.duration||60); if(!isNaN(s) && current>=s && current<e && s>=bestStart){best=c;bestStart=s;}}
    return best;
  }
  function pinClass(date){
    var now=new Date(), today=isoDate(now); if(date!==today) return null;
    var current=now.getHours()*60+now.getMinutes(); var best=null; var bestStart=-1;
    for(var i=0;i<state.classes.length;i++){
      var c=state.classes[i]; if(String(c.date||c.classDate||c.class_date||'').slice(0,10)!==date) continue;
      var s=minutes(c.time||c.startTime||c.start_time); var e=minutes(c.endTime||c.end||c.end_time); if(isNaN(e)) e=s+Number(c.duration||60);
      if(!isNaN(s) && !isNaN(e) && current>=s && current<=e+PIN_GRACE_MINUTES && s>=bestStart){best=c;bestStart=s;}
    }
    return best;
  }
  function clockFromMinutes(value){
    var total=Number(value||0); while(total<0) total+=1440; total=total%1440;
    return pad(Math.floor(total/60))+':'+pad(total%60);
  }
  function displayContext(){
    var date=selectedDate(); var ac=activeClass(date); var forced=String(param('force')||'').toLowerCase(); var hyrox=findByDate(state.hyroxWorkouts,date); var workout=findByDate(state.workouts,date); var mode='cross';
    if(forced==='hyrox') mode='hyrox'; else if(forced==='cross') mode='cross'; else if(ac && classType(ac)==='hyrox') mode='hyrox'; else if(!workout && hyrox) mode='hyrox';
    return {date:date,activeClass:ac,hyrox:hyrox,workout:workout,mode:mode};
  }
  function contextSignature(context){
    var ac=context.activeClass;
    return [context.date,context.mode,ac&&(ac.id||ac.time||ac.startTime||''),ac&&(ac.endTime||ac.end||''),updatedAt].join('|');
  }
  function refreshForCurrentTime(){
    if(!state) return;
    var context=displayContext();
    if(contextSignature(context)!==renderSignature) renderAll(context);
    else {
      var ac=context.activeClass;
      els.dateLine.innerHTML=esc(formatLong(context.date)+(ac?' · '+(ac.time||ac.startTime||'')+'-'+(ac.endTime||ac.end||''):'')+' · '+timeNow());
      renderPin();
    }
  }
  function renderAll(context){
    context=context||displayContext();
    var date=context.date, ac=context.activeClass, hyrox=context.hyrox, workout=context.workout, mode=context.mode;
    document.body.className = (param('debug')==='1'?'debug ':'') + (mode==='hyrox'?'hyrox':'');
    els.modeLabel.innerHTML=mode==='hyrox'?'HYROX':'HPBOX TV LG';
    els.title.innerHTML=mode==='hyrox'?esc((hyrox&&hyrox.title)||'HYROX'):esc((workout&&workout.title)||'Treino de hoje');
    els.dateLine.innerHTML=esc(formatLong(date)+(ac?' · '+(ac.time||'')+'-'+(ac.endTime||''):'')+' · '+timeNow());
    if(mode==='hyrox') renderHyrox(hyrox,date); else renderCross(workout,date);
    renderPin(); renderCommunity(workout,date);
    els.updated.innerHTML='Última atualização: '+(updatedAt?timeNowFromIso(updatedAt):timeNow());
    renderSignature=contextSignature(context);
  }
  function renderCross(w,date){
    if(!w){ els.sections.className='sections only-wod'; els.sections.innerHTML='<div class="empty">Sem treino programado para '+esc(formatShort(date))+'.</div>'; return; }
    var b=w.blocks||{};
    var warm=publicBlockText(b.warmup||w.warmup||w.warmUp||w.aquecimento||'','warmup');
    var rawStr=publicBlockText(b.strength||w.strength||w.forca||w.skill||'','strength');
    var descStr=publicBlockText(b.strengthPublicNotes||w.strengthPublicNotes||w.strengthDescription||'','strength');
    var str=descStr||rawStr;
    var wod=publicBlockText(b.metcon||w.metcon||w.wod||w.workout||'','wod');
    var cls='sections';
    if(!warm) cls+=' no-warmup';
    if(!str) cls+=' no-strength';
    if(!wod) cls+=' no-wod';
    if(!warm&&!str&&wod) cls+=' only-wod';
    els.sections.className=cls;
    var html='';
    if(warm) html+='<div class="block warmup"><div class="head"></div><div class="body">'+blockHtml('warmup', warm)+'</div></div>';
    if(str) html+='<div class="block strength"><div class="head"></div><div class="body">'+blockHtml('strength', str)+'</div></div>';
    if(wod) html+='<div class="block wod"><div class="head"></div><div class="body">'+blockHtml('wod', wod)+'</div></div>';
    els.sections.innerHTML=html;
  }
  function renderHyrox(h,date){
    var blocks=arr(h&&h.blocks); var publicBlocks=[]; for(var i=0;i<blocks.length;i++){var t=String(blocks[i].type||'').toLowerCase(); if(t!=='coach_notes' && clean(blocks[i].content||blocks[i].body||blocks[i].text||'')) publicBlocks.push(blocks[i]);}
    els.sections.className='sections hyrox-sections';
    if(!publicBlocks.length){ els.sections.innerHTML='<div class="empty">Sem HYROX público para '+esc(formatShort(date))+'.</div>'; return; }
    var html=''; var widthClass='';
    for(var j=0;j<publicBlocks.length && j<6;j++){var b=publicBlocks[j]; var title=b.title||labelBlock(b.type)||('Part '+(j+1)); var content=clean(b.content||b.body||b.text||''); html+='<div class="hyroxblock"><span class="type">'+esc(labelBlock(b.type))+'</span><h3>'+esc(title)+'</h3><pre>'+esc(content)+'</pre></div>';}
    els.sections.innerHTML=html;
  }
  function labelBlock(t){t=String(t||'part').toLowerCase(); if(t==='warmup') return 'Warm Up'; if(t==='finisher') return 'Finisher'; if(t==='cooldown') return 'Cooldown'; return 'Part';}
  function clean(v){return String(v||'').replace(/\r\n/g,'\n').replace(/^\s+|\s+$/g,'');}
  function isPlaceholderLine(line,kind){
    var value=clean(line).toLowerCase();
    if(!value) return true;
    if(kind==='warmup') return value==='adicionar warm-up' || value==='adicionar warm up' || value==='adicionar aquecimento';
    if(kind==='strength') return value==='adicionar força / skill' || value==='adicionar força/skill' || value==='adicionar força' || value==='adicionar skill';
    if(kind==='wod') return value==='adicionar metcon' || value==='adicionar wod' || value==='sem wod programado' || value==='sem wod programado.';
    return false;
  }
  function publicBlockText(value,kind){
    var text=clean(value);
    if(!text) return '';
    var lines=text.split('\n');
    while(lines.length && isPlaceholderLine(lines[0],kind)){lines.shift();}
    return clean(lines.join('\n'));
  }
  function estLines(text, charsPerLine){
    var parts=clean(text).split('\n');
    var total=0;
    var cpl=charsPerLine||24;
    for(var i=0;i<parts.length;i++){
      var s=String(parts[i]||'');
      if(!s){ total+=1; continue; }
      total += Math.max(1, Math.ceil(s.length / cpl));
    }
    return total;
  }
  function splitForColumns(text, charsPerLine){
    var lines=clean(text).split('\n');
    var cpl=charsPerLine||24;
    var total=estLines(text,cpl);
    var target=Math.ceil(total/2);
    var left=[]; var right=[]; var acc=0; var toLeft=true;
    for(var i=0;i<lines.length;i++){
      var s=String(lines[i]||'');
      var units=!s?1:Math.max(1, Math.ceil(s.length / cpl));
      if(toLeft && acc>=target && i<lines.length-1){ toLeft=false; }
      if(toLeft){ left.push(s); acc+=units; }
      else { right.push(s); }
    }
    if(!right.length){
      var cut=Math.ceil(lines.length/2);
      left=lines.slice(0,cut);
      right=lines.slice(cut);
    }
    return {left:left.join('\n'), right:right.join('\n')};
  }
  function blockHtml(kind, text){
    var t=clean(text);
    var chars=kind==='wod'?18:20;
    var threshold=kind==='wod'?11:10;
    var units=estLines(t, chars);
    if(units<=threshold){ return '<pre>'+esc(t)+'</pre>'; }
    var split=splitForColumns(t, chars);
    return '<div class="cols"><div class="col"><pre>'+esc(split.left)+'</pre></div><div class="col"><pre>'+esc(split.right)+'</pre></div></div>';
  }
  function userName(id){for(var i=0;i<state.users.length;i++){if(String(state.users[i].id||'')===String(id||'')) return state.users[i].name||'';} return '';}
  function resultName(r){
    var names=arr(r.teamNames); var cleanNames=[]; var i;
    for(i=0;i<names.length;i++){if(clean(names[i])) cleanNames.push(clean(names[i]));}
    if(!cleanNames.length){
      var ids=arr(r.team);
      for(i=0;i<ids.length;i++){var member=userName(ids[i]); if(member) cleanNames.push(member);}
    }
    if(cleanNames.length) return cleanNames.join(' + ');
    return clean(r.userName||r.athleteName||userName(r.userId||r.athleteId)||'Atleta');
  }
  function scoreCapacity(total){
    if(!els.scores) return total;
    var mode=total>20?'ultra':total>13?'dense':total>8?'compact':'';
    els.scores.className='score-list'+(mode?' '+mode:'');
    var height=Number(els.scores.clientHeight||0);
    var rowHeight=mode==='ultra'?26:mode==='dense'?30:mode==='compact'?37:44;
    var fallback=mode==='ultra'?24:mode==='dense'?19:mode==='compact'?15:11;
    return height>0?Math.max(1,Math.floor(height/rowHeight)):fallback;
  }
  function scoreOf(r){var vals=[r.metconScore,r.wodScore,r.score,r.resultScore,r.finalScore]; if(r.metcon){vals.push(r.metcon.score); vals.push(r.metcon.result);} if(r.wod){vals.push(r.wod.score); vals.push(r.wod.result);} for(var i=0;i<vals.length;i++){if(vals[i]!=null && String(vals[i]).replace(/\s/g,'')!=='') return String(vals[i]);} return '';}
  function resultDate(r){return String(r.workoutDate||r.date||r.createdAt||r.updatedAt||'').slice(0,10);}
  function renderCommunity(w,date){
    var rows=[]; for(var i=0;i<state.results.length;i++){var r=state.results[i]; var sc=scoreOf(r); if(sc && (!date || resultDate(r)===date || String(r.workoutId||'')===String(w&&w.id||''))) rows.push(r);}
    var capacity=scoreCapacity(rows.length); var visibleRows=rows.slice(0,capacity);
    var h=''; if(!visibleRows.length) h='<div class="row empty-score-row">Sem resultados WOD.</div>'; else for(var j=0;j<visibleRows.length;j++){h+='<div class="row"><span class="score-name">'+esc(resultName(visibleRows[j]))+'</span><span class="score">'+esc(scoreOf(visibleRows[j]))+'</span></div>';}
    if(els.scores){els.scores.innerHTML=h;}
    if(els.feed){
      var f=state.feed.slice(0,3); h=''; if(!f.length) h='<div class="row">Sem atividade recente.</div>'; else for(var k=0;k<f.length;k++){h+='<div class="row">'+esc(userName(f[k].userId)||f[k].userName||'Atleta')+'<small>'+esc(String(f[k].text||f[k].description||f[k].message||'Registou atividade.').slice(0,80))+'</small></div>';}
      els.feed.innerHTML=h;
    }
  }
  function renderPin(){
    if(!state){return;} var date=selectedDate(); var ac=pinClass(date); if(!ac){setPinVisible(false);return;} var code=String(ac.accessCode||'').replace(/\D/g,''); if(!code){setPinVisible(false);return;} var e=minutes(ac.endTime||ac.end||ac.end_time); if(isNaN(e)){var s=minutes(ac.time||ac.startTime||ac.start_time);e=s+Number(ac.duration||60);} setPinVisible(true); els.pinBox.innerHTML='<span class="kicker">PIN da aula</span><h2 style="font-size:44px;color:#ffd36a;letter-spacing:4px;margin:6px 0">'+esc(code)+'</h2><div class="row">Válido até '+esc(clockFromMinutes(e+PIN_GRACE_MINUTES))+'</div>';
  }
  function setPinVisible(visible){
    if(els.pinBox) els.pinBox.style.display=visible?'block':'none';
    if(els.sidePanel) els.sidePanel.className='side'+(visible?' has-pin':'');
  }
  function timeNowFromIso(v){var d=new Date(v); if(isNaN(d.getTime())) return '--'; return pad(d.getHours())+':'+pad(d.getMinutes());}
  function showError(msg){ if(els.title){els.title.innerHTML='Erro ao carregar TV';} if(els.dateLine){els.dateLine.innerHTML='Vê o quadro amarelo em baixo';} if(els.sections){els.sections.className='sections only-wod';els.sections.innerHTML='<div class="errorbox">'+esc(msg)+'</div>';} if(els.scores){els.scores.innerHTML='<div class="row">Sem dados.</div>';} if(els.feed){els.feed.innerHTML='<div class="row">Sem dados.</div>';} appendLog('ERRO: '+msg); }
  function boot(){ if(started) return; started=true; init(); }
  if(document.body) { setTimeout(boot,1); }
  else if(window.addEventListener) window.addEventListener('load',boot,false);
  else window.onload=boot;
})();
