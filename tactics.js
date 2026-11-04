'use strict';
const tacticsWidth = 8;
const tacticsHeight = 5;
const skills = [
 {id:'strike', name:'短棍', cost:2, range:1, target:'foe', tip:'近身造成 30 伤害。'},
 {id:'oil', name:'泼油', cost:1, range:5, target:'tile', tip:'铺油。敌人经过会停步，可用火点燃。'},
 {id:'fire', name:'火折', cost:2, range:5, target:'tile', tip:'点燃地面。油上爆燃，波及相邻格。'},
 {id:'water', name:'泼水', cost:1, range:5, target:'tile', tip:'熄火，留下水面，可导电或结冰。'},
 {id:'frost', name:'凝霜', cost:2, range:5, target:'tile', tip:'造成 14 伤害。冻结水面，水上的敌人失去下一次行动。'},
 {id:'shock', name:'震雷', cost:2, range:5, target:'tile', tip:'造成 22 伤害。若击中水面，沿相连水面传导并打断敌人。'},
 {id:'gust', name:'推风', cost:2, range:4, target:'foe', tip:'把敌人推远两格，可推入陷阱或火地。'},
 {id:'snare', name:'绊索', cost:1, range:4, target:'empty', tip:'在空格布绳。踩中的敌人失去下一次行动。'},
 {id:'step', name:'越步', cost:2, range:4, target:'empty', tip:'直接跃到空格，可越过燃烧地面。'},
 {id:'guard', name:'格挡', cost:1, target:'self', tip:'获得 24 点护盾，持续到下次行动。'},
 {id:'heal', name:'药敷', cost:2, target:'self', tip:'回复 30 体力。'},
 {id:'borrow', name:'借势', cost:3, range:2, target:'foe', tip:'造成 36 伤害。对失衡或被打断的敌人造成 60。'}
];
const terrainNames = {oil:'油',fire:'火',water:'水',ice:'冰',snare:'绳'};
let tactics = null;
const realTimeCombat = startCombat;
startCombat = function(kind, rematch=false){
 if(kind!=='rival')return realTimeCombat(kind,rematch);
 openTactics(false,rematch);
};
function openTactics(practice=true, rematch=false){
 closeDialogue();
 keys={};joy=null;enemy=null;heroAnim.cast=null;
 const units=[
  {id:'rival',name:'沈砚',x:5,y:2,hp:144,max:144,hit:28},
  {id:'left',name:'木偶甲',x:5,y:0,hp:42,max:42,hit:12},
  {id:'right',name:'木偶乙',x:6,y:4,hp:42,max:42,hit:12}
 ];
 tactics={practice,rematch,round:1,ap:6,hp:100,shield:0,x:1,y:2,selection:'move',
  used:new Set(), terrain:new Map(),units,log:['沈砚和两具机关木偶已摆好阵势。'],phase:'play'};
 if(!practice&&storyState.route==='bond'){
  tactics.shield=24;
  sayTactics('阿团替你护住开场，获得 24 护盾。');
 }else if(!practice&&storyState.route==='truth'){
  units[0].offBalance=true;
  sayTactics('诊簿让你看穿沈砚的起手，开场即可借势。');
 }
 placeTerrain(4,2,'water');
 placeTerrain(4,3,'oil');
 placeTerrain(4,0,'oil');
 forecast();
 setMode('tactics');refreshUI();paintTactics();
}
function gridKey(x,y){return y*tacticsWidth+x}
function validCell(x,y){return x>=0&&x<tacticsWidth&&y>=0&&y<tacticsHeight}
function cellDistance(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}
function onCell(x,y){return tactics.units.find(unit=>unit.hp>0&&unit.x===x&&unit.y===y)}
function playerOn(x,y){return tactics.x===x&&tactics.y===y}
function vacant(x,y){return validCell(x,y)&&!onCell(x,y)&&!playerOn(x,y)}
function placeTerrain(x,y,kind,life=3){
 if(validCell(x,y))tactics.terrain.set(gridKey(x,y),{kind,life});
}
function sayTactics(line){tactics.log.push(line)}
function hitTactics(unit,amount){
 unit.hp=Math.max(0,unit.hp-amount);
 sayTactics(unit.name+'受到 '+amount+' 伤害'+(unit.hp===0?'，退场。':'。'));
}
function playerHit(amount){
 const absorbed=Math.min(tactics.shield,amount);
 tactics.shield-=absorbed;
 tactics.hp=Math.max(0,tactics.hp-(amount-absorbed));
 if(amount>absorbed)sayTactics('你受到 '+(amount-absorbed)+' 伤害。');
 else sayTactics('格挡挡下了这一击。');
}
function stepOn(unit,x,y){
 const key=gridKey(x,y),surface=tactics.terrain.get(key)?.kind;
 if(surface==='fire'){
  if(unit)hitTactics(unit,16);
  else playerHit(16);
 }
 if(unit&&surface==='snare'){
  unit.skip=true;
  tactics.terrain.delete(key);
  sayTactics(unit.name+'触发绊索，下一次行动被打断。');
 }
 if(unit&&surface==='ice'){unit.offBalance=true;unit.skip=true}
 if(unit&&surface==='oil')unit.offBalance=true;
}
function connected(x,y,kind){
 const cells=[], queue=[[x,y]], visited=new Set();
 while(queue.length){
  const [a,b]=queue.shift(),key=gridKey(a,b);
  if(!validCell(a,b)||visited.has(key)||tactics.terrain.get(key)?.kind!==kind)continue;
  visited.add(key);cells.push([a,b]);
  queue.push([a+1,b],[a-1,b],[a,b+1],[a,b-1]);
 }
 return cells;
}
function movementPath(x,y){
 if(!vacant(x,y))return null;
 const queue=[{x:tactics.x,y:tactics.y,path:[]}], visited=new Set([gridKey(tactics.x,tactics.y)]);
 while(queue.length){
  const here=queue.shift();
  if(here.x===x&&here.y===y)return here.path;
  if(here.path.length>=tactics.ap)continue;
  for(const [nx,ny] of [[here.x+1,here.y],[here.x-1,here.y],[here.x,here.y+1],[here.x,here.y-1]]){
   const key=gridKey(nx,ny);
   if(!vacant(nx,ny)||visited.has(key))continue;
   visited.add(key);queue.push({x:nx,y:ny,path:[...here.path,[nx,ny]]});
  }
 }
 return null;
}
function canCast(skill,x,y){
 if(!skill||tactics.ap<skill.cost||tactics.used.has(skill.id))return false;
 if(skill.target==='self')return playerOn(x,y);
 if(cellDistance(tactics,{x,y})>skill.range)return false;
 if(skill.target==='foe')return !!onCell(x,y);
 if(skill.target==='empty')return vacant(x,y);
 return true;
}
function selectTactics(id){
 if(tactics.phase!=='play')return;
 tactics.selection=id;
 const skill=skills.find(item=>item.id===id);
 if(skill?.target==='self')playCell(tactics.x,tactics.y);
 else paintTactics();
}
function playCell(x,y){
 if(!tactics||tactics.phase!=='play'||!validCell(x,y))return;
 const skill=skills.find(item=>item.id===tactics.selection);
 if(!skill){
  const path=movementPath(x,y);
  if(!path){sayTactics('点空格移动。每走一格消耗 1 行动力。');paintTactics();return}
  tactics.ap-=path.length;
  for(const [nx,ny] of path){
   tactics.x=nx;tactics.y=ny;stepOn(null,nx,ny);
   if(tactics.hp<=0)break;
  }
 }else{
  if(!canCast(skill,x,y)){sayTactics('这个目标不可用。请看高亮格和剩余行动力。');paintTactics();return}
  tactics.ap-=skill.cost;tactics.used.add(skill.id);
  sayTactics('你使用了「'+skill.name+'」。');
  applySkill(skill.id,x,y);
  tactics.selection='move';
 }
 finishOrPaint();
}
function applySkill(id,x,y){
 const unit=onCell(x,y),surface=tactics.terrain.get(gridKey(x,y))?.kind;
 switch(id){
  case 'strike': hitTactics(unit,30);return;
  case 'borrow': hitTactics(unit,unit.skip||unit.offBalance?60:36);return;
  case 'oil': placeTerrain(x,y,'oil');return;
  case 'water': placeTerrain(x,y,'water');return;
  case 'snare': placeTerrain(x,y,'snare');return;
  case 'guard': tactics.shield+=24;return;
  case 'heal': tactics.hp=Math.min(100,tactics.hp+30);return;
  case 'step': tactics.x=x;tactics.y=y;stepOn(null,x,y);return;
  case 'gust': {
   const dx=x-tactics.x,dy=y-tactics.y;
   const sx=Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0;
   const sy=sx?0:Math.sign(dy);
   for(let n=0;n<2;n++){
    const nx=unit.x+sx,ny=unit.y+sy;
    if(!vacant(nx,ny)){hitTactics(unit,12);break}
    unit.x=nx;unit.y=ny;stepOn(unit,nx,ny);
    if(unit.hp<=0||unit.skip)break;
   }
   unit.offBalance=true;
   return;
  }
  case 'fire': {
   if(surface==='water'){tactics.terrain.delete(gridKey(x,y));sayTactics('火折被积水熄灭。');return}
   const oil=connected(x,y,'oil');
   const affected=new Set();
   if(oil.length){
    sayTactics('油遇火，爆燃！');
    for(const [a,b] of oil){
     placeTerrain(a,b,'fire',2);
     for(const [nx,ny] of [[a,b],[a+1,b],[a-1,b],[a,b+1],[a,b-1]]){
      if(validCell(nx,ny))affected.add(gridKey(nx,ny));
     }
    }
   }else{placeTerrain(x,y,'fire',2);affected.add(gridKey(x,y))}
   for(const foe of tactics.units)if(foe.hp>0&&affected.has(gridKey(foe.x,foe.y)))hitTactics(foe,oil.length?39:18);
   if(affected.has(gridKey(tactics.x,tactics.y)))playerHit(oil.length?24:12);
   return;
  }
  case 'frost':
  case 'shock': {
   const water=connected(x,y,'water');
   if(water.length)sayTactics(id==='frost'?'水面结冰，冻住站在上面的人。':'雷沿积水传导，打断水面上的敌人。');
   for(const [a,b] of water.length?water:[[x,y]]){
    if(id==='frost'&&water.length)placeTerrain(a,b,'ice',2);
    const foe=onCell(a,b);
    if(foe){
     hitTactics(foe,id==='frost'?14:22);
     if(water.length)foe.skip=true;
    }
    if(water.length&&playerOn(a,b))playerHit(id==='frost'?8:12);
   }
  }
 }
}
function forecast(){
 for(const foe of tactics.units){
  if(foe.hp<=0)continue;
  const player={x:tactics.x,y:tactics.y};
  foe.mark=cellDistance(foe,player)<=4?player:null;
 }
}
function endTacticsTurn(){
 if(tactics.phase!=='play')return;
 sayTactics('对手行动。');
 for(const foe of tactics.units){
  if(foe.hp<=0)continue;
  if(foe.skip){
   foe.skip=false;foe.offBalance=true;
   sayTactics(foe.name+'的动作被打断。');
   continue;
  }
  foe.offBalance=false;
  if(foe.mark&&playerOn(foe.mark.x,foe.mark.y))playerHit(foe.hit);
  else if(foe.mark){foe.offBalance=true;sayTactics('你躲开了'+foe.name+'的预告攻击。')}
  if(tactics.hp<=0)break;
  if(tactics.terrain.get(gridKey(foe.x,foe.y))?.kind==='fire')hitTactics(foe,12);
  if(foe.hp<=0||tactics.terrain.get(gridKey(foe.x,foe.y))?.kind==='oil')continue;
  const moves=[[foe.x+1,foe.y],[foe.x-1,foe.y],[foe.x,foe.y+1],[foe.x,foe.y-1]]
   .filter(([x,y])=>vacant(x,y)&&cellDistance({x,y},tactics)<cellDistance(foe,tactics));
  moves.sort(([a,b],[x,y])=>cellDistance({x:a,y:b},tactics)-cellDistance({x,y},tactics));
  if(moves.length){
   [foe.x,foe.y]=moves[0];stepOn(foe,foe.x,foe.y);
  }
 }
 if(tactics.hp>0&&tactics.terrain.get(gridKey(tactics.x,tactics.y))?.kind==='fire')playerHit(12);
 for(const [key,surface] of tactics.terrain)if(--surface.life<=0)tactics.terrain.delete(key);
 tactics.round++;tactics.ap=6;tactics.used.clear();tactics.shield=0;tactics.selection='move';
 forecast();finishOrPaint();
}
function finishOrPaint(){
 if(tactics.hp<=0){tactics.phase='lost';paintTactics();return}
 if(tactics.units[0].hp<=0){
  if(tactics.practice){tactics.phase='won';paintTactics();return}
  const rematch=tactics.rematch;
  tactics=null;
  enemy={kind:'rival',rematch};
  p.x=920;p.y=960;
  hideOverlay();combatWon();
  return;
 }
 paintTactics();
}
function exitTactics(){
 const practice=tactics.practice;
 tactics=null;hideOverlay();
 if(practice){title();return}
 p.x=1010;p.y=970;
 setMode('explore');refreshUI();
}
function paintTactics(){
 const state=tactics, skill=skills.find(item=>item.id===state.selection);
 let board='';
 for(let y=0;y<tacticsHeight;y++)for(let x=0;x<tacticsWidth;x++){
  const foe=onCell(x,y),self=playerOn(x,y),surface=state.terrain.get(gridKey(x,y))?.kind;
  const danger=state.units.some(unit=>unit.hp>0&&!unit.skip&&unit.mark?.x===x&&unit.mark.y===y);
  const active=state.phase==='play'&&(skill?canCast(skill,x,y):!!movementPath(x,y));
  const tag=foe?foe.name+(foe.skip?' · 打断':foe.offBalance?' · 失衡':''):self?'你':'';
  const actor=foe?.id==='rival'?'<img src="assets/npc-rival-v1.webp" alt="">':self?'<img src="assets/hero-rig/standing.webp" alt="">':foe?'<span class="training-doll">偶</span>':'';
  board+='<button class="tac-cell '+(surface||'')+(danger?' danger':'')+(active?' valid':'')+'" aria-label="第 '+(y+1)+' 行第 '+(x+1)+' 列 '+tag+' '+(terrainNames[surface]||'')+(danger?' 攻击预告':'')+'" onclick="playCell('+x+','+y+')">'+actor+(tag?'<b>'+tag+(foe?' '+foe.hp:'')+'</b>':'')+(surface?'<em>'+terrainNames[surface]+'</em>':'')+'</button>';
 }
 const cards=skills.map(item=>'<button title="'+item.tip+'" aria-pressed="'+(state.selection===item.id)+'" '+(state.ap<item.cost||state.used.has(item.id)||state.phase!=='play'?'disabled ':'')+'onclick="selectTactics(\''+item.id+'\')"><b>'+item.name+'</b><small>'+item.cost+' AP</small></button>').join('');
 const result=state.phase==='won'?'试招获胜':state.phase==='lost'?'这一阵失手了':'第 '+state.round+' 回合';
 const action=state.phase==='play'?'<button class="tac-end" onclick="endTacticsTurn()">结束回合</button>':'<button class="tac-end" onclick="openTactics('+state.practice+','+state.rematch+')">再试一局</button>';
 const tip=skill?skill.tip:'点高亮空格移动，每格 1 AP。红框是下回合的攻击位置。';
 showOverlay('<section class="tac-panel paper" role="dialog" aria-label="演武场回合制战斗"><header class="tac-header"><div><span class="eyebrow">杂役院 · 演武场</span><h1>'+result+'</h1></div><div>行动力 <strong>'+state.ap+' / 6</strong><br>体力 '+state.hp+' / 100'+(state.shield?' · 护盾 '+state.shield:'')+'</div><button onclick="exitTactics()">离开</button></header><div class="tac-grid">'+board+'</div><div class="tac-note" aria-live="polite">'+state.log.slice(-2).join(' ')+'</div><div class="tac-bar"><button aria-pressed="'+(state.selection==='move')+'" onclick="selectTactics(\'move\')"><b>移动</b><small>1 AP／格</small></button>'+cards+'</div><footer class="tac-footer"><span>'+tip+'<br><small>试试 泼油 → 火折，或 泼水 → 凝霜／震雷。击败沈砚即可取胜。</small></span>'+action+'</footer></section>','tac-overlay');
}
const explorationKeydown=onkeydown;
onkeydown=function(event){
 if(mode==='tactics'){
  if(event.key==='Escape'){event.preventDefault();exitTactics()}
  return;
 }
 explorationKeydown(event);
};
