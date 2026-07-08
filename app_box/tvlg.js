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
    els={days:byId('days'),modeSwitch:byId('modeSwitch'),modeLabel:byId('modeLabel'),title:byId('title'),dateLine:byId('dateLine'),sections:byId('sections'),scores:byId('scores'),feed:byId('feed'),pinBox:byId('pinBox'),side:byId('sidePanel'),updated:byId('updated')};
    if(param('debug')==='1') document.body.className += ' debug';
    renderDays();
    log('JS OK v15 team topwod · '+timeNow()+' · a pedir Supabase sem cachebuster REST...');
    loadState();
    // Mantém a TV viva sem precisar de refresh manual:
    // - renderAll troca automaticamente Cross/HYROX quando começa uma aula ativa.
    // - loadState volta a ler a base online para apanhar alterações feitas no Admin.
    setInterval(function(){ if(state){ renderAll(); } },15000);
    setInterval(function(){ loadState(true); },60000);
  }
  function buildUrl(date,force){
    var q='?date='+encodeURIComponent(date||selectedDate());
    if(force==='cross' || force==='hyrox') q+='&force='+encodeURIComponent(force);
    if(param('debug')==='1') q+='&debug=1';
    return q;
  }
  function currentForcedMode(){
    var forced=String(param('force')||param('mode')||param('tipo')||'').toLowerCase();
    if(forced==='hyrox') return 'hyrox';
    if(forced==='cross' || forced==='crosstraining') return 'cross';
    // Sem force/mode/tipo = AUTO. É isto que deve ficar na TV fixa da sala.
    return '';
  }
  function renderModeSwitch(mode, autoClass){
    if(!els.modeSwitch) return;
    var forced=currentForcedMode();
    var active=forced || 'auto';
    var actual=mode || forced || 'cross';
    var autoCls='modeBtn auto'+(active==='auto'?' active':'')+' actual-'+actual;
    var crossCls='modeBtn cross'+(active==='cross'?' active':'');
    var hyroxCls='modeBtn hyrox'+(active==='hyrox'?' active':'');
    var date=selectedDate();
    var autoText=autoClass ? (actual==='hyrox'?'Aula HYROX':'Aula Cross') : 'Sem aula ativa';
    els.modeSwitch.innerHTML='<a class="'+autoCls+'" href="'+buildUrl(date,'auto')+'"><span>Modo Auto</span><strong>Auto</strong><em>'+esc(autoText)+'</em></a><a class="'+crossCls+'" href="'+buildUrl(date,'cross')+'"><span>Manual</span><strong>Cross</strong></a><a class="'+hyroxCls+'" href="'+buildUrl(date,'hyrox')+'"><span>Manual</span><strong>HYROX</strong></a>';
  }
  function renderDays(){
    var sel=selectedDate(), mon=monday(sel), today=isoDate(new Date()), html='', names=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'], forced=currentForcedMode();
    for(var i=0;i<7;i++){var d=addDays(mon,i); var cls='day'; if(d===sel) cls+=' active'; if(d===today) cls+=' today'; html+='<a class="'+cls+'" href="'+buildUrl(d,forced)+'"><span>'+names[i]+'</span><strong>'+formatShort(d)+'</strong></a>';}
    els.days.innerHTML=html;
    renderModeSwitch(forced,null);
  }
  function loadState(silent){
    var url=CFG.url.replace(/\/$/,'')+'/rest/v1/'+encodeURIComponent(CFG.table)+'?select=payload,updated_at&id=eq.'+encodeURIComponent(CFG.id)+'&limit=1';
    try{
      var xhr=new XMLHttpRequest();
      var done=false;
      var timer=setTimeout(function(){ if(done) return; done=true; try{xhr.abort();}catch(e){} if(!silent){showError('Tempo limite ao ligar ao Supabase.\nA TV abriu a página, mas não recebeu dados em 15 segundos.');} },15000);
      xhr.onreadystatechange=function(){
        if(xhr.readyState!==4 || done) return;
        done=true; clearTimeout(timer);
        if(!silent || param('debug')==='1') appendLog('HTTP '+xhr.status+' · resposta '+String(xhr.responseText||'').length+' chars · v15');
        if(xhr.status<200 || xhr.status>=300){ if(!silent){showError('Erro Supabase HTTP '+xhr.status+'\n'+String(xhr.responseText||'').slice(0,500));} return; }
        try{
          var rows=JSON.parse(xhr.responseText||'[]');
          if(!rows || !rows.length || !rows[0].payload){ if(!silent){showError('Supabase respondeu, mas sem payload.\nResposta: '+String(xhr.responseText||'').slice(0,500));} return; }
          state=normalize(rows[0].payload);
          updatedAt=rows[0].updated_at||'';
          if(!silent || param('debug')==='1') appendLog('OK · workouts '+state.workouts.length+' · hyrox '+state.hyroxWorkouts.length+' · classes '+state.classes.length+' · results '+state.results.length);
          renderAll();
        }catch(e){ if(!silent){showError('Erro a ler JSON/payload.\n'+(e.message||e));} }
      };
      xhr.open('GET',url,true);
      xhr.setRequestHeader('apikey',CFG.key);
      xhr.setRequestHeader('Authorization','Bearer '+CFG.key);
      xhr.setRequestHeader('Accept','application/json');
      try{xhr.setRequestHeader('Cache-Control','no-cache');}catch(e){}
      xhr.send(null);
    }catch(e){ if(!silent){showError('Erro JavaScript/XHR.\n'+(e.message||e));} }
  }
  function normalize(raw){
    raw=raw||{};
    return {workouts:arr(raw.workouts), hyroxWorkouts:arr(raw.hyroxWorkouts||raw.hyroxSessions), classes:arr(raw.classes), results:arr(raw.results||raw.workoutResults||raw.scores), feed:arr(raw.feed||raw.activityFeed), users:arr(raw.users)};
  }
  function arr(v){return Object.prototype.toString.call(v)==='[object Array]'?v:[];}
  function findByDate(list,date){for(var i=0;i<list.length;i++){ if(String(list[i].date||list[i].workoutDate||'').slice(0,10)===date) return list[i]; } return null;}
  function firstText(obj,names){
    if(!obj) return '';
    for(var i=0;i<names.length;i++){
      var key=names[i];
      if(obj[key]!==undefined && obj[key]!==null && String(obj[key]).replace(/\s/g,'')!=='') return String(obj[key]);
    }
    return '';
  }
  function getWorkoutBlock(w,kind){
    if(!w) return '';
    var b=w.blocks||w.programming||w.sections||w.training||{};
    var text='';
    if(kind==='warmup') text = firstText(b,['warmup','warmUp','warm_up','aquecimento']) || firstText(w,['warmup','warmUp','warm_up','aquecimento','workoutWarmup']);
    if(kind==='strength') text = firstText(b,['strength','forca','força','skill']) || firstText(w,['strength','forca','força','skill','workoutStrength']);
    if(kind==='metcon') text = firstText(b,['metcon','wod','workout','main','condicionamento']) || firstText(w,['metcon','wod','workout','main','workoutMetcon','conditioning']);
    text = clean(text);
    return isPlaceholderBlock(text, kind) ? '' : text;
  }
  function normalizePlaceholderText(v){
    var text=clean(v).toLowerCase();
    if(text.normalize){ text=text.normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
    text=text.replace(/[–—]/g,'-').replace(/[\.!,;:]+/g,' ').replace(/[\-_]+/g,' ').replace(/\s*\/\s*/g,' ').replace(/\s+/g,' ').replace(/^\s+|\s+$/g,'');
    return text;
  }
  function isPlaceholderBlock(text,kind){
    var n=normalizePlaceholderText(text);
    if(!n) return true;
    var common={
      'adicionar':1,
      'adicionar bloco':1,
      'sem bloco':1,
      'sem conteudo':1,
      'sem conteudo programado':1
    };
    if(common[n]) return true;
    var warm={
      'adicionar warm up':1,'adicionar warmup':1,'adicionar aquecimento':1,
      'sem warm up':1,'sem warmup':1,'sem warm up programado':1,'sem warmup programado':1,
      'sem aquecimento':1,'sem aquecimento programado':1
    };
    var strength={
      'adicionar strength':1,'adicionar forca':1,'adicionar forca skill':1,'adicionar skill':1,
      'sem strength':1,'sem strength programado':1,'sem strength programada':1,
      'sem forca':1,'sem forca programada':1,'sem forca programado':1,
      'sem skill':1,'sem skill programado':1,'sem forca skill':1,'sem forca skill programado':1
    };
    var wod={
      'adicionar wod':1,'adicionar metcon':1,'adicionar workout':1,'adicionar condicionamento':1,
      'sem wod':1,'sem wod programado':1,'sem wod programada':1,
      'sem metcon':1,'sem metcon programado':1,'sem workout':1,'sem workout programado':1,
      'sem condicionamento':1,'sem condicionamento programado':1
    };
    if(kind==='warmup') return !!warm[n];
    if(kind==='strength') return !!strength[n];
    if(kind==='metcon') return !!wod[n];
    return !!(warm[n]||strength[n]||wod[n]);
  }
  function workoutDebug(w){
    if(param('debug')!=='1' || !w) return;
    appendLog('Treino '+String(w.id||'sem-id')+' · title='+String(w.title||'')+' · blocks='+(w.blocks?'sim':'não')+' · warm '+getWorkoutBlock(w,'warmup').length+' · strength '+getWorkoutBlock(w,'strength').length+' · wod '+getWorkoutBlock(w,'metcon').length);
  }
  function classType(c){var raw=String((c&&(c.classType||c.type||c.kind||c.title||c.name||c.label))||'cross').toLowerCase(); return raw.indexOf('hyrox')>=0?'hyrox':'cross';}
  function minutes(t){var m=String(t||'').match(/(\d{1,2}):(\d{2})/); if(!m) return NaN; return Number(m[1])*60+Number(m[2]);}
  function activeClass(date){
    var now=new Date(), today=isoDate(now); if(date!==today || !state) return null;
    var current=now.getHours()*60+now.getMinutes(); var best=null, bestStart=-1;
    for(var i=0;i<state.classes.length;i++){
      var c=state.classes[i];
      if(String(c.date||'').slice(0,10)!==date || c.ended) continue;
      var s=minutes(c.time||c.startTime);
      var e=minutes(c.endTime||c.end);
      if(isNaN(e)) e=s+Number(c.duration||60);
      if(!isNaN(s) && current>=s && current<e && s>=bestStart){ best=c; bestStart=s; }
    }
    return best;
  }
  function modeFromClassOrDefault(ac, workout, hyrox){
    if(ac) return classType(ac)==='hyrox' ? 'hyrox' : 'cross';
    if(!workout && hyrox) return 'hyrox';
    return 'cross';
  }
  function classTypeLabel(c){return classType(c)==='hyrox'?'HYROX':'CrossTraining';}
  function renderAll(){
    if(!state) return;
    var date=selectedDate();
    var ac=activeClass(date);
    var forced=currentForcedMode();
    var hyrox=findByDate(state.hyroxWorkouts,date);
    var workout=findByDate(state.workouts,date);
    var autoMode=modeFromClassOrDefault(ac, workout, hyrox);
    var mode=forced || autoMode;
    document.body.className = (param('debug')==='1'?'debug ':'') + (mode==='hyrox'?'hyrox':'');
    renderDays();
    renderModeSwitch(mode, ac);
    els.modeLabel.innerHTML=mode==='hyrox'?'HYROX':'HPBOX TV LG';
    els.title.innerHTML=mode==='hyrox'?esc((hyrox&&hyrox.title)||'HYROX'):esc((workout&&workout.title)||'Treino de hoje');
    var modeInfo=forced ? ('Manual: '+(mode==='hyrox'?'HYROX':'CrossTraining')) : (ac ? ('Auto: '+classTypeLabel(ac)) : 'Auto: sem aula ativa');
    els.dateLine.innerHTML=esc(formatLong(date)+(ac?' · '+(ac.time||'')+'-'+(ac.endTime||''):'')+' · '+modeInfo+' · '+timeNow());
    if(mode==='hyrox') renderHyrox(hyrox,date); else renderCross(workout,date);
    renderCommunity(workout,date); renderPin();
    els.updated.innerHTML='Última atualização: '+(updatedAt?timeNowFromIso(updatedAt):timeNow());
    if(param('debug')==='1') appendLog('Modo '+mode+' · '+modeInfo+' · aula '+(ac?classTypeLabel(ac)+' '+(ac.time||'')+'-'+(ac.endTime||''):'nenhuma'));
  }
  function renderCross(w,date){
    if(!w){ els.sections.className='sections only-wod'; els.sections.innerHTML='<div class="empty">Sem treino programado para '+esc(formatShort(date))+'.</div>'; return; }
    workoutDebug(w);
    var warm=getWorkoutBlock(w,'warmup'); var str=getWorkoutBlock(w,'strength'); var wod=getWorkoutBlock(w,'metcon');
    if(!warm && !str && !wod){
      els.sections.className='sections only-wod';
      els.sections.innerHTML='<div class="empty">Treino criado, mas sem blocos para mostrar.</div>';
      return;
    }
    var cls='sections';
    if(!warm) cls+=' no-warmup';
    if(!str) cls+=' no-strength';
    if(!wod) cls+=' no-wod';
    if(!warm && !str && wod) cls+=' only-wod';
    els.sections.className=cls;
    var html='';
    if(warm) html+='<div class="block warmup"><div class="head"></div><div class="body"><pre>'+esc(warm)+'</pre></div></div>';
    if(str) html+='<div class="block strength"><div class="head"></div><div class="body"><pre>'+esc(str)+'</pre></div></div>';
    if(wod) html+='<div class="block wod"><div class="head"></div><div class="body"><pre>'+esc(wod)+'</pre></div></div>';
    els.sections.innerHTML=html;
  }
  function renderHyrox(h,date){
    var blocks=arr(h&&h.blocks); var publicBlocks=[];
    for(var i=0;i<blocks.length;i++){
      var t=String(blocks[i].type||'').toLowerCase();
      var kind=t==='warmup'?'warmup':(t==='strength'?'strength':'metcon');
      var content=clean(blocks[i].content||blocks[i].body||blocks[i].text||'');
      if(t!=='coach_notes' && content && !isPlaceholderBlock(content,kind)) publicBlocks.push(blocks[i]);
    }
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
  function resultWorkoutMatch(r,w,date){
    if(!r) return false;
    var wid=String(r.workoutId||r.wodId||r.sessionId||r.trainingId||'');
    var rid=String(r.id||r.resultId||'');
    var wId=String((w&&w.id)||'');
    if(wId && wid===wId) return true;
    if(wId && rid.indexOf(wId)>=0) return true;
    if(date && wid.indexOf(date)>=0) return true;
    return resultDate(r)===date;
  }
  function scoreNumber(v){
    var s=String(v||'').replace(',', '.').replace(/^\s+|\s+$/g,'');
    var m=s.match(/^(\d{1,3}):(\d{1,2})$/);
    if(m) return Number(m[1])*60+Number(m[2]);
    m=s.match(/^(\d+)\s*\+\s*(\d+)$/);
    if(m) return Number(m[1])*1000+Number(m[2]);
    m=s.match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : NaN;
  }
  function isTimeScore(v){return /^\s*\d{1,3}:\d{1,2}\s*$/.test(String(v||''));}
  function compareScoreRows(a,b,w){
    var as=scoreOf(a), bs=scoreOf(b);
    var av=scoreNumber(as), bv=scoreNumber(bs);
    if(isNaN(av) || isNaN(bv)) return 0;
    var type=String((w&&w.scoreType)||'').toLowerCase();
    var lowerWins=(type==='time' || isTimeScore(as) || isTimeScore(bs));
    return lowerWins ? av-bv : bv-av;
  }
  function levelOf(r){
    var raw=String((r&&(r.metconLevel||r.level||r.version||r.scale||r.category))||'RX').replace(/^\s+|\s+$/g,'');
    if(!raw) raw='RX';
    var n=raw.toLowerCase();
    if(n.indexOf('adapt')===0) return 'ADAP';
    if(n.indexOf('scale')>=0 || n==='sc') return 'SCALE';
    return raw.toUpperCase();
  }
  function personName(r){
    if(!r) return 'Atleta';
    var direct=String(r.userName||r.athleteName||r.name||r.author||'').replace(/^\s+|\s+$/g,'');
    var idName=userName(r.userId||r.athleteId||r.createdBy);
    if(idName && idName!=='Atleta') return idName;
    return direct || 'Atleta';
  }
  function teamIdsOf(r){
    var ids=Object.prototype.toString.call(r&&r.teamUserIds)==='[object Array]'?r.teamUserIds:[];
    if(ids.length) return ids;
    var single=String((r&&(r.userId||r.athleteId||r.createdBy))||'').replace(/^\s+|\s+$/g,'');
    return single?[single]:[];
  }
  function teamModeOf(r){
    var raw=String((r&&(r.teamMode||r.mode||r.resultMode))||'').toLowerCase();
    var count=teamIdsOf(r).length;
    if(raw==='team' || raw==='equipa' || raw==='equipas' || raw==='group' || raw==='grupo') return 'team';
    if(raw==='pair' || raw==='pairs' || raw==='pares' || raw==='dupla' || raw==='duplas') return 'pair';
    if(count>=3) return 'team';
    if(count>=2) return 'pair';
    return 'individual';
  }
  function isTeamResult(r){
    var mode=teamModeOf(r);
    return mode==='pair' || mode==='team';
  }
  function compactName(name){
    var parts=String(name||'').replace(/^\s+|\s+$/g,'').split(/\s+/).filter(Boolean);
    if(!parts.length) return 'Atleta';
    if(parts.length===1) return parts[0];
    var last=parts[parts.length-1];
    return parts[0]+' '+String(last).charAt(0).toUpperCase()+'.';
  }
  function teamLabel(mode){
    if(mode==='team') return 'EQUIPA';
    if(mode==='pair') return 'DUPLA';
    return 'TEAM';
  }
  function teamDisplayName(r){
    var ids=teamIdsOf(r);
    var names=[];
    for(var i=0;i<ids.length;i++){
      var nm=userName(ids[i]);
      if(nm && nm!=='Atleta') names.push(compactName(nm));
    }
    if(!names.length){
      var direct=String(r.teamName||r.teamLabel||r.userName||r.athleteName||'').replace(/^\s+|\s+$/g,'');
      return direct || 'Team';
    }
    if(names.length<=3) return names.join(' + ');
    return names[0]+' + '+names[1]+' +'+(names.length-2);
  }
  function renderCommunityName(r){
    if(isTeamResult(r)){
      var mode=teamModeOf(r);
      return '<span class="score-team"><span class="score-team-label">'+esc(teamLabel(mode))+'</span><span class="score-team-members">'+esc(teamDisplayName(r))+'</span></span>';;
    }
    return '<span class="score-person">'+esc(personName(r))+'</span>';;
  }
  function renderCommunity(w,date){
    var rows=[];
    for(var i=0;i<state.results.length;i++){
      var r=state.results[i];
      var sc=scoreOf(r);
      if(sc && resultWorkoutMatch(r,w,date)) rows.push(r);
    }
    rows.sort(function(a,b){return compareScoreRows(a,b,w);});
    rows=rows.slice(0,8);
    var h='';
    if(!rows.length) h='<div class="row">Sem resultados WOD.</div>';
    else for(var j=0;j<rows.length;j++){
      h+='<div class="row score-row"><span class="score-rank">'+(j+1)+'</span><span class="score">'+esc(scoreOf(rows[j]))+'</span><span class="score-name">'+renderCommunityName(rows[j])+'<span class="score-level">'+esc(levelOf(rows[j]))+'</span></span></div>';
    }
    els.scores.innerHTML=h;
  }
  function renderPin(){
    if(!state){return;}
    var date=selectedDate();
    var ac=activeClass(date);
    if(!ac){
      if(els.pinBox){els.pinBox.style.display='none'; els.pinBox.innerHTML='';}
      if(els.side){els.side.className='side';}
      return;
    }
    var code=String(ac.accessCode||'').replace(/\D/g,'');
    if(!code){
      if(els.pinBox){els.pinBox.style.display='none'; els.pinBox.innerHTML='';}
      if(els.side){els.side.className='side';}
      return;
    }
    if(els.side){els.side.className='side has-pin';}
    els.pinBox.style.display='block';
    els.pinBox.innerHTML='<span class="kicker">PIN da aula</span><h2 style="font-size:44px;line-height:44px;color:#ffd36a;letter-spacing:4px;margin:4px 0 4px 0;font-weight:900">'+esc(code)+'</h2><div class="row" style="margin:0;font-size:14px;line-height:18px;padding:4px 7px">'+esc((ac.time||'')+'-'+(ac.endTime||''))+'</div>';
  }
  function timeNowFromIso(v){var d=new Date(v); if(isNaN(d.getTime())) return '--'; return pad(d.getHours())+':'+pad(d.getMinutes());}
  function showError(msg){ els.title.innerHTML='Erro ao carregar TV'; els.dateLine.innerHTML='Vê o quadro amarelo em baixo'; els.sections.className='sections only-wod'; els.sections.innerHTML='<div class="errorbox">'+esc(msg)+'</div>'; if(els.scores){els.scores.innerHTML='<div class="row">Sem dados.</div>';} if(els.feed){els.feed.innerHTML='<div class="row">Sem dados.</div>';} appendLog('ERRO: '+msg); }
  function boot(){ if(started) return; started=true; init(); }
  if(document.body) { setTimeout(boot,1); }
  else if(window.addEventListener) window.addEventListener('load',boot,false);
  else window.onload=boot;
})();