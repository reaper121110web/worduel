const setup = document.getElementById("setup-screen");
const game = document.getElementById("game-screen");
const gridEl = document.getElementById("grid");

let word="", size=3, board=[];
let player=1, turn=0, active=true;
let mode="pvp", difficulty="easy";
let score={1:0,2:0};

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

  placeMove(r,c,cell,turn);

  if(checkWin(board)){
    endGame();
    return;
  }

  nextTurn();

  if(mode==="ai" && player===2){
    setTimeout(aiMove,50);
  }
}

/* PLACE */
function placeMove(r,c,cell,t){
  const letter=word[t%3];
  board[r][c]=letter;

  const el = cell || gridEl.children[r*size+c];
  el.textContent=letter;
  el.classList.add(player===1?"p1":"p2");
}

/* AI */
function aiMove(){
  let move;

  if(difficulty==="easy") move=randomMove();
  else if(difficulty==="medium") move=randomMove();
  else if(difficulty==="hard") move=minimaxRoot(4);
  else move=perfectMove(); // fixed

  if(move){
    placeMove(move.r,move.c,null,turn);
    if(checkWin(board)){ endGame(); return;}
    nextTurn();
  }
}

/* PERFECT */
function perfectMove(){
  let best=-Infinity;
  let bestMove=null;

  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!board[r][c]){

        board[r][c]=word[turn%3];

        let val=minimaxFull(board,turn+1,false);

        board[r][c]="";

        if(val>best){
          best=val;
          bestMove={r,c};
        }
      }
    }
  }
  return bestMove;
}

/* TRUE MINIMAX */
function minimaxFull(b,t,isMax){
  if(checkWin(b)){
    return isMax ? -1000 : 1000;
  }

  if(isFull(b)) return 0;

  let best=isMax?-Infinity:Infinity;

  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!b[r][c]){

        b[r][c]=word[t%3];

        let val=minimaxFull(b,t+1,!isMax);

        b[r][c]="";

        if(isMax){
          best=Math.max(best,val);
        }else{
          best=Math.min(best,val);
        }
      }
    }
  }

  return best;
}

/* HARD */
function minimaxRoot(depth){
  let best=-Infinity, move=null;

  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!board[r][c]){

        board[r][c]=word[turn%3];

        let val=minimax(board,turn+1,depth-1,false);

        board[r][c]="";

        if(val>best){
          best=val;
          move={r,c};
        }
      }
    }
  }
  return move;
}

function minimax(b,t,depth,isMax){
  if(checkWin(b)) return isMax?-100:100;
  if(depth===0) return 0;

  let best=isMax?-Infinity:Infinity;

  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!b[r][c]){

        b[r][c]=word[t%3];

        let val=minimax(b,t+1,depth-1,!isMax);

        b[r][c]="";

        if(isMax) best=Math.max(best,val);
        else best=Math.min(best,val);
      }
    }
  }
  return best;
}

/* HELPERS */
function isFull(b){
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!b[r][c]) return false;
    }
  }
  return true;
}

function randomMove(){
  let empty=[];
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!board[r][c]) empty.push({r,c});
    }
  }
  return empty[Math.floor(Math.random()*empty.length)];
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
