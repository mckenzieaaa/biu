/* Eight interpolated gait keys, two-bone legs and independent painted attachments. */
const rigAtlas=new Image();rigAtlas.src='assets/hero-rig-atlas.webp';const rigImages={};for(const q of heroRigData)rigImages[q.name]=rigAtlas;for(const n of ['upper-leg','lower-leg'])rigImages[n]=rigAtlas;
const rigMotion={phase:0,weight:0,clock:0,turn:1,loading:false};
const gaitKeys=[[14,0,0],[6,0,0],[-5,0,0],[-15,0,-.04],[-17,3,-.10],[-7,10,-.16],[7,12,.04],[16,4,.09]];
function gaitAt(phase){const k=(phase/(Math.PI*2)%1+1)%1*8,i=Math.floor(k),u=k-i,v=u*u*(3-2*u);return gaitKeys[i].map((a,j)=>a+(gaitKeys[(i+1)%8][j]-a)*v)}
function rigStep(dt,dx,dy){rigMotion.clock+=dt;const moving=Math.hypot(dx,dy)>.01&&!heroAnim.cast;const target=moving?1:0;rigMotion.weight+=(target-rigMotion.weight)*(1-Math.exp(-dt/(moving?.13:.11)));if(rigMotion.weight<.002)rigMotion.weight=0;if(moving||rigMotion.weight>.01)rigMotion.phase+=dt*(moving?10.4:7.4);if(Math.abs(dx)>.1)rigMotion.turn=dx>0?1:-1;}
function drawRigPart(name,transform){const meta=heroRigData.find(q=>q.name===name),im=rigImages[name];if(!meta||!ready(im))return;g.save();if(transform)transform();const b=meta.bounds;g.drawImage(im,...meta.atlas,b[0],b[1],b[2]-b[0],b[3]-b[1]);g.restore()}
function rigPivot(x,y,a){g.translate(x,y);g.rotate(a);g.translate(-x,-y)}
function rigLeg(side,phase){const near=side==='near',hip={x:near?145:211,y:366},rest={x:near?142:213,y:423};const a=gaitAt(phase),w=rigMotion.weight,foot={x:rest.x+a[0]*w,y:rest.y-a[1]*w};const dx=foot.x-hip.x,dy=foot.y-hip.y,L1=31,L2=30,d=Math.max(.001,Math.min(60.8,Math.hypot(dx,dy))),base=Math.atan2(dy,dx),off=Math.acos(Math.min(1,(L1*L1+d*d-L2*L2)/(2*L1*d))),angle=base-off,knee={x:hip.x+Math.cos(angle)*L1,y:hip.y+Math.sin(angle)*L1};
 function segment(name,p0,p1,width){const im=rigImages[name];if(!ready(im))return;g.save();g.translate(p0.x,p0.y);g.rotate(Math.atan2(p1.y-p0.y,p1.x-p0.x)-Math.PI/2);g.drawImage(im,...heroRigExtra[name],-width/2,-width*.3,width,Math.hypot(p1.x-p0.x,p1.y-p0.y)+width*.65);g.restore()}
 segment('upper-leg',hip,knee,31);segment('lower-leg',knee,foot,27);drawRigPart('boot_'+side,()=>{g.translate(foot.x-rest.x,foot.y-rest.y);rigPivot(rest.x,rest.y,a[2]*w)});
}
function drawLayeredHero(x,y,face){const complete=heroRigData.every(q=>ready(rigImages[q.name]));if(!complete){if(ready(art.hero)){g.save();g.translate(x,y);g.scale(face,1);g.drawImage(art.hero,-57,-99,114,124);g.restore()}return}
 const w=rigMotion.weight,ph=rigMotion.phase,cast=heroAnim.cast,ct=cast?cast.elapsed/cast.duration:0,spell=cast?(ct<.45?ct/.45:ct<.68?1:Math.max(0,(1-ct)/.32)):0,bodyY=-1.5*w*(.5-.5*Math.cos(ph*2)),armSwing=.065*Math.sin(ph)*w,blink=(rigMotion.clock%4.7)>4.55;face=cast?cast.face:rigMotion.turn;
 g.save();g.translate(x,y+22);g.scale(face*.30,.30);g.translate(-170,-487);rigLeg('far',ph+Math.PI);rigLeg('near',ph);
 const body=()=>{g.translate(0,bodyY);rigPivot(180,345,.012*Math.sin(ph)*w-.012*spell)};
 const head=()=>{body();rigPivot(205,160,-.009*Math.sin(ph-.4)*w)};
 const arms=(near)=>{body();rigPivot(near?137:245,near?210:212,(near?armSwing:-armSwing)-(near?1.03:.35)*spell)};
 const skip=/^(thigh|calf|boot)_/;
 for(const q of heroRigData){const n=q.name;if(skip.test(n)||n==='star_brooch')continue;let tr=body;
 if(n==='hair_back'||n==='hair_front'||n==='face_neck'||n.startsWith('eye_')||n.startsWith('brow_')||n==='mouth')tr=head;
 if(n.startsWith('upperarm_')||n.startsWith('forearm_')||n.startsWith('hand_'))tr=()=>arms(n.endsWith('near'));
 if(n==='coat_panel_near'||n==='coat_panel_far'||n==='skirt')tr=()=>{body();rigPivot(180,280,.015*Math.sin(ph+.6)*w)};
 if(n==='scarf_tail')tr=()=>{body();rigPivot(170,196,.035*Math.sin(ph-.7)*w)};
 if(n==='satchel'||n==='bag_strap')tr=()=>{body();rigPivot(170,200,-.02*Math.sin(ph)*w)};
 if(blink&&n.startsWith('eye_')){g.save();head();const m=q.pivot;g.translate(0,m[1]);g.scale(1,.16);g.translate(0,-m[1]);drawRigPart(n);g.restore()}else drawRigPart(n,tr);
 }
 g.restore();
}
drawAnimatedHero=drawLayeredHero;
const rigUpdate=update;update=function(dt){const x=p?.x||0,y=p?.y||0;rigUpdate(dt);rigStep(dt,(p?.x||0)-x,(p?.y||0)-y)};
const rigBegin=beginStage;beginStage=function(...args){rigMotion.phase=0;rigMotion.weight=0;rigMotion.turn=1;rigBegin(...args)};
