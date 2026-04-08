const setup = document.getElementById("setup-screen");
const game = document.getElementById("game-screen");
const gridEl = document.getElementById("grid");

let word="", size=3, board=[];
let player=1, turn=0, active=true;
let mode="pvp", difficulty="easy";
let score={1:0,2:0};

let TT = new Map();

/* START */
document.getElementById("start-btn").onclick=()=>{
  const input=document.getElementById("word-input").value.toUpperCase();
  if(!/^[A-Z]{3}$/.test(input)){ alert("Enter exactly 3 letters"); return;}

  word=input;
  size=+document.getElementById("grid-size").value;
  mode=document.getElementById("mode").value;
  difficulty=document.getElementById("difficulty").value;

  setup.classList.remove("active");
  game.classList.add("active");

  init();
};

/* INIT */
function init(){
  board=Array.from({length:size},()=>Array(size).fill(""));
  gridEl.innerHTML="";
  gridEl.style.gridTemplateColumns=`repeat(${size},1fr)`;

  player=1; turn=0; active=true;
  TT.clear();

  document.getElementById("winner-display").textContent="";
  updateScore();
  updateTurn();

  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      const cell=document.createElement("div");
      cell.className="cell";
      cell.onclick=()=>move(r,c,cell);
      gridEl.appendChild(cell);
    }
  }
}

/* MOVE */
function move(r,c,cell){
  if(!active || board[r][c]) return;

  placeMove(r,c,cell);

  if(checkWin()){
    endGame();
    return;
  }

  nextTurn();

  if(mode==="ai" && player===2){
    setTimeout(aiMove,50);
  }
}

/* PLACE */
function placeMove(r,c,cell){
  const letter=word[turn%3];
  board[r][c]=letter;

  const el = cell || gridEl.children[r*size+c];
  el.textContent=letter;
  el.classList.add(player===1?"p1":"p2");
}

/* AI */
function aiMove(){
  let move;

  if(difficulty==="easy") move=randomMove();
  else if(difficulty==="medium") move=blockOrRandom();
  else if(difficulty==="hard") move=minimaxRoot(4);
  else move=perfectMove(); // TRUE PERFECT

  if(move){
    placeMove(move.r,move.c);
    if(checkWin()){ endGame(); return;}
    nextTurn();
  }
}

/* PERFECT SEARCH (NO DEPTH LIMIT) */
function perfectMove(){
  let best=-Infinity;
  let bestMove=null;

  let moves=getCandidateMoves();

  for(let m of moves){
    board[m.r][m.c]=word[turn%3];

    let val=minimaxFull(false,-Infinity,Infinity);

    board[m.r][m.c]="";

    if(val>best){
      best=val;
      bestMove=m;
    }
  }

  return bestMove;
}

/* FULL MINIMAX (NO DEPTH LIMIT) */
function minimaxFull(isMax,alpha,beta){
  let key = board.flat().join("") + turn;
  if(TT.has(key)) return TT.get(key);

  if(checkWin()){
    return isMax ? -1000 : 1000;
  }

  if(isBoardFull()){
    return 0;
  }

  let best=isMax?-Infinity:Infinity;
  let moves=getCandidateMoves();

  for(let m of moves){
    board[m.r][m.c]=word[(turn + moves.length)%3];

    let val=minimaxFull(!isMax,alpha,beta);

    board[m.r][m.c]="";

    if(isMax){
      best=Math.max(best,val);
      alpha=Math.max(alpha,val);
    }else{
      best=Math.min(best,val);
      beta=Math.min(beta,val);
    }

    if(beta<=alpha) break;
  }

  TT.set(key,best);
  return best;
}

/* HARD MODE */
function minimaxRoot(depth){
  let best=-Infinity, move=null;
  let moves=getCandidateMoves();

  for(let m of moves){
    board[m.r][m.c]=word[turn%3];
    let val=minimax(depth-1,false,-Infinity,Infinity);
    board[m.r][m.c]="";

    if(val>best){
      best=val;
      move=m;
    }
  }
  return move;
}

function minimax(depth,isMax,alpha,beta){
  if(checkWin()) return isMax ? -100 : 100;
  if(depth===0) return 0;

  let best=isMax?-Infinity:Infinity;
  let moves=getCandidateMoves();

  for(let m of moves){
    board[m.r][m.c]=word[(turn+depth)%3];
    let val=minimax(depth-1,!isMax,alpha,beta);
    board[m.r][m.c]="";

    if(isMax){
      best=Math.max(best,val);
      alpha=Math.max(alpha,val);
    }else{
      best=Math.min(best,val);
      beta=Math.min(beta,val);
    }

    if(beta<=alpha) break;
  }
  return best;
}

/* HELPERS */
function getCandidateMoves(){
  let moves=[];
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!board[r][c]) moves.push({r,c});
    }
  }
  return moves;
}

function isBoardFull(){
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!board[r][c]) return false;
    }
  }
  return true;
}

function randomMove(){
  let empty=getCandidateMoves();
  return empty[Math.floor(Math.random()*empty.length)];
}

function blockOrRandom(){
  return randomMove();
}

/* TURN */
function nextTurn(){
  turn++;
  player=player===1?2:1;
  updateTurn();
}

function updateTurn(){
  document.getElementById("turn-indicator").textContent=
    `Player ${player} → ${word[turn%3]}`;
}

/* SCORE */
function updateScore(){
  document.getElementById("scoreboard").textContent=
    `P1: ${score[1]} | P2: ${score[2]}`;
}

/* WIN */
function checkWin(){
  const dirs=[[0,1],[1,0],[1,1],[1,-1]];

  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      for(let [dr,dc] of dirs){
        let seq=[];
        for(let i=0;i<3;i++){
          let nr=r+dr*i,nc=c+dc*i;
          if(nr<0||nc<0||nr>=size||nc>=size) break;
          seq.push(board[nr][nc]);
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

/* END */
function endGame(){
  active=false;
  score[player]++;
  updateScore();
  document.getElementById("winner-display").textContent=`Player ${player} wins`;
}

/* BUTTONS */
document.getElementById("play-again").onclick=init;

document.getElementById("reset").onclick=()=>{
  game.classList.remove("active");
  setup.classList.add("active");
  score={1:0,2:0};
};