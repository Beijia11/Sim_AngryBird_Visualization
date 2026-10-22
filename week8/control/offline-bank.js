// Decode pre-rendered images only. No Worker, pixel processing, MLS or interpolation.
export class Bank {
 constructor(data){this.data=data;this.sheets=new Map();this.loading=new Map();this.frames=new Map();this.pinned=new Set();}
 pin(ids){this.pinned=new Set(ids);}
 has(asset){return this.sheets.has(asset.id);}
 async load(asset){if(this.has(asset)){const im=this.sheets.get(asset.id);this.sheets.delete(asset.id);this.sheets.set(asset.id,im);return;}if(this.loading.has(asset.id))return this.loading.get(asset.id);
  const task=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{this.sheets.set(asset.id,image);for(const [id] of this.sheets){if(this.sheets.size<=36)break;if(!this.pinned.has(id))this.sheets.delete(id);}resolve();};image.onerror=()=>reject(Error('Offline asset failed to load: '+asset.id));image.src=asset.atlas;});this.loading.set(asset.id,task);try{await task;}finally{this.loading.delete(asset.id);}
 }
 get(asset,frame){const id=asset.id+':'+frame;if(this.frames.has(id))return this.frames.get(id);const im=this.sheets.get(asset.id);if(!im)throw Error('Offline atlas not ready: '+asset.id);const w=this.data.width,h=this.data.height,cols=asset.fromClip?5:this.data.cols;const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(im,frame%cols*w,Math.floor(frame/cols)*h,w,h,0,0,w,h);this.frames.set(id,c);while(this.frames.size>80)this.frames.delete(this.frames.keys().next().value);return c;}
}
