onmessage = function(e){
  let {board,size,word,turn,difficulty} = e.data;

  function clone(b){ return b.map(r=>r.slice()); }

  function getMoves(b){
    let m=[];
    for(let r=0;r<size;r++){
      for(let c=0;c<size;c++){
        if(!b[r][c]) m.push({r,c});
      }
    }
    return m;
  }

  function checkWin(b){
    const dirs=[[0,1],[1,0],[1,1],[1,-1]];

    for(let r=0;r<size;r++){
      for(let c=0;c<size;c++){
        for(let [dr,dc] of dirs){
          let seq=[];
          for(let i=0;i<3;i++){
            let nr=r+dr*i,nc=c+dc*i;
            if(nr<0||nc<0||nr>=size||nc>=size) break;
            seq.push(b[nr][nc]);
          }
          if(seq.length===3){
            let s=seq.join("");
            let rev=seq.slice().reverse().join("");
            if(s===word || rev===word){
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  function minimax(b,t,depth,isMax){
    if(checkWin(b)) return isMax?-100:100;
    if(depth===0) return 0;

    let best=isMax?-Infinity:Infinity;

    for(let m of getMoves(b)){
      let nb=clone(b);
      nb[m.r][m.c]=word[t%3];

      let val=minimax(nb,t+1,depth-1,!isMax);

      if(isMax) best=Math.max(best,val);
      else best=Math.min(best,val);
    }

    return best;
  }

  let bestMove=null, best=-Infinity;
  let depth = difficulty==="unbeatable" ? 6 : 3;

  for(let m of getMoves(board)){
    let nb=clone(board);
    nb[m.r][m.c]=word[turn%3];

    let val=minimax(nb,turn+1,depth,false);

    if(val>best){
      best=val;
      bestMove=m;
    }
  }

  postMessage(bestMove);
};
