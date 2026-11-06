// One tie-break set. Regular games use advantage scoring; at 6–6, first to 7 by 2.
export const opponent=role=>role==='near'?'far':'near';
export class TennisScore {
 constructor(firstServer='near'){this.points={near:0,far:0};this.games={near:0,far:0};this.sets={near:0,far:0};this.gameServer=firstServer;this.tieBreak=false;this.tieServer=null;this.winner=null;this.totalPoints=0;}
 get server(){if(!this.tieBreak)return this.gameServer;const n=this.points.near+this.points.far;return n===0?this.tieServer:Math.floor((n-1)/2)%2===0?opponent(this.tieServer):this.tieServer;}
 get court(){return (this.points.near+this.points.far)%2===0?'deuce':'ad';}
 display(role){if(this.tieBreak)return String(this.points[role]);const a=this.points[role],b=this.points[opponent(role)];if(a>=3&&b>=3)return a===b?'40':a>b?'AD':'40';return ['0','15','30','40'][Math.min(a,3)];}
 get label(){if(this.winner)return 'Match complete';if(this.tieBreak)return 'Tie-break · first to 7, win by 2';if(this.points.near>=3&&this.points.far>=3)return this.points.near===this.points.far?'Deuce':`Advantage ${this.points.near>this.points.far?'you':'agent'}`;return 'One set · advantage scoring';}
 award(role){if(this.winner)return null;const other=opponent(role),server=this.server;this.points[role]++;this.totalPoints++;let gameWon=false,setWon=false;
  if(this.tieBreak){if(this.points[role]>=7&&this.points[role]-this.points[other]>=2){this.games[role]++;gameWon=true;setWon=true;this.gameServer=opponent(this.tieServer);}}
  else if(this.points[role]>=4&&this.points[role]-this.points[other]>=2){this.games[role]++;this.points={near:0,far:0};this.gameServer=opponent(this.gameServer);gameWon=true;if(this.games[role]>=6&&this.games[role]-this.games[other]>=2)setWon=true;else if(this.games.near===6&&this.games.far===6){this.tieBreak=true;this.tieServer=this.gameServer;}}
  if(setWon){this.sets[role]++;this.winner=role;}
  return {winner:role,server,gameWon,setWon,matchWon:!!this.winner,totalPoints:this.totalPoints};
 }
 snapshot(){return {points:{...this.points},display:{near:this.display('near'),far:this.display('far')},games:{...this.games},sets:{...this.sets},server:this.server,court:this.court,tieBreak:this.tieBreak,winner:this.winner,label:this.label,totalPoints:this.totalPoints};}
}
