// Bound decoded atlas memory and reserve request slots for the current action.
export class AtlasCache {
 constructor({limit=192*1024*1024,concurrency=4}={}){this.limit=limit;this.concurrency=concurrency;this.entries=new Map();this.queue=[];this.active=0;this.bytes=0;this.pins=new Set();this.keep=new Set();this.evictions=0;this.loads=0;this.failed=new Set();}
 pin(url){this.pins.add(url);}
 protect(urls){this.keep=new Set(urls);this.trim();}
 get(url,priority=0){let e=this.entries.get(url);if(e){e.used=performance.now();e.priority=Math.min(e.priority,priority);if(e.error&&performance.now()-e.errorAt>5000){this.entries.delete(url);return this.get(url,priority);}this.pump();return e;}
 e={url,priority,ready:false,used:performance.now(),bytes:0,im:null};e.promise=new Promise((resolve,reject)=>{e.resolve=resolve;e.reject=reject;});e.promise.catch(()=>{});this.entries.set(url,e);this.queue.push(e);this.pump();return e;}
 pump(){this.queue.sort((a,b)=>a.priority-b.priority||b.used-a.used);while(this.active<this.concurrency&&this.queue.length){const e=this.queue[0];if(e.priority>=2&&this.active>=1)break;this.queue.shift();this.active++;const im=new Image();e.im=im;im.decoding='async';im.fetchPriority=e.priority===0?'high':'low';im.onload=async()=>{try{await im.decode();e.ready=true;e.bytes=im.naturalWidth*im.naturalHeight*4;this.bytes+=e.bytes;this.loads++;this.failed.delete(e.url);e.resolve(im);}catch(err){this.fail(e,err);}finally{this.active--;this.trim();this.pump();}};im.onerror=()=>{this.fail(e,new Error('Image unavailable: '+e.url));this.active--;this.pump();};im.src=e.url;}}
 fail(e,error){e.error=true;e.errorAt=performance.now();this.failed.add(e.url);e.reject(error);}
 trim(){const candidates=[...this.entries.values()].filter(e=>e.ready&&!this.pins.has(e.url)&&!this.keep.has(e.url)).sort((a,b)=>a.used-b.used);for(const e of candidates){if(this.bytes<=this.limit)break;this.entries.delete(e.url);this.bytes-=e.bytes;e.im.onload=null;e.im.onerror=null;e.im.src='';e.im=null;e.ready=false;this.evictions++;}
 // Drop obsolete speculative jobs before they become requests.
 const stale=this.queue.filter(e=>performance.now()-e.used>2500&&!this.keep.has(e.url)&&!this.pins.has(e.url));for(const e of stale){this.entries.delete(e.url);e.reject(new Error('Speculative preload expired'));}this.queue=this.queue.filter(e=>!stale.includes(e));}
 stats(){return {entries:this.entries.size,decodedMB:+(this.bytes/1048576).toFixed(1),limitMB:this.limit/1048576,active:this.active,queued:this.queue.length,loads:this.loads,evictions:this.evictions,failures:[...this.failed]};}
}
export class PoseCache {
 constructor(players){this.players=players;this.entries=new Map();this.queue=[];this.active=0;this.edges=Object.fromEntries(Object.entries(players).map(([r,p])=>[r,new Map(p.bank.edges.map(e=>[e.id,e]))]));}
 ensure(role,id){const url=this.players[role].bank.poseBundles?.[id];if(!url)return;const old=this.entries.get(url);if(old&&(!old.failed||performance.now()-old.at<5000))return;const entry={url,role,at:performance.now()};this.entries.set(url,entry);this.queue.push(entry);this.pump();}
 pump(){while(this.active<2&&this.queue.length){const e=this.queue.shift();this.active++;fetch(e.url,{priority:'low'}).then(r=>{if(!r.ok)throw Error(r.status);return r.json();}).then(poses=>{for(const [id,keys] of Object.entries(poses)){const edge=this.edges[e.role].get(id);if(edge)edge.keys=keys;}e.ready=true;}).catch(()=>{e.failed=true;e.at=performance.now();}).finally(()=>{this.active--;this.pump();});}}
}
