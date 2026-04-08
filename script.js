const setup = document.getElementById("setup");
const game = document.getElementById("game");
const gridEl = document.getElementById("grid");
const thinkingEl = document.getElementById("thinking");

let board=[], size=3, word="";
let turn=0, player=1, active=true;
let difficulty="easy";

let worker = new Worker("aiWorker.js");

/* START */
document.getElementById("start").onclick=()=>{
  word=document.getElementById("word").value.toUpperCase();
  if(!/^[A-Z]{3}$/.test(word)){alert("Enter 3 letters");return;}

  size=+document.getElementById("size").value;
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

  turn=0; player=1; active=true;
  updateTurn();
  thinkingEl.textContent="";

  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      let cell=document.createElement("div");
      cell.className="cell";
      cell.onclick=()=>move(r,c,cell);
      gridEl.appendChild(cell);
    }
  }
}

/* MOVE */
function move(r,c,cell){
  if(!active || board[r][c]) return;

  place(r,c,cell);

  if(checkWin(board)){
    end("You win");
    return;
  }

  turn++; player=2;
  updateTurn();

  aiMove();
}

/* AI */
function aiMove(){
  thinkingEl.textContent="AI thinking...";

  worker.postMessage({
    board,
    size,
    word,
    turn,
    difficulty
  });
}

/* RECEIVE AI MOVE */
worker.onmessage = function(e){
  const {r,c} = e.data;

  thinkingEl.textContent="";

  place(r,c);

  if(checkWin(board)){
    end("AI wins");
    return;
  }

  turn++; player=1;
  updateTurn();
};

/* PLACE */
function place(r,c,cell){
  let letter=word[turn%3];
  board[r][c]=letter;

  let el=cell || gridEl.children[r*size+c];
  el.textContent=letter;
  el.classList.add(player===1?"p1":"p2");
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
function end(msg){
  active=false;
  thinkingEl.textContent=msg;
}

/* TURN */
function updateTurn(){
  document.getElementById("turn").textContent=
    `Turn → ${word[turn%3]}`;
}

/* RESET */
document.getElementById("reset").onclick=()=>{
  game.classList.remove("active");
  setup.classList.add("active");
};
