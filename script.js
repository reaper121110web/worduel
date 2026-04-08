const setup = document.getElementById("setup-screen");
const game = document.getElementById("game-screen");
const gridEl = document.getElementById("grid");

let word="", size=3, board=[];
let player=1, turn=0, active=true;
let mode="pvp";

let score = {1:0,2:0};

/* START */
document.getElementById("start-btn").onclick=()=>{
  const input=document.getElementById("word-input").value.toUpperCase();
  if(!/^[A-Z]{3}$/.test(input)){ alert("Enter exactly 3 letters"); return;}

  word=input;
  size=+document.getElementById("grid-size").value;
  mode=document.getElementById("mode").value;

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

  updateTurn();
  updateScore();

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
    setTimeout(aiMove,300);
  }
}

/* PLACE */
function placeMove(r,c,cell){
  const letter=word[turn%3];
  board[r][c]=letter;

  if(cell){
    cell.textContent=letter;
    cell.classList.add(player===1?"p1":"p2");
  }else{
    const el=gridEl.children[r*size+c];
    el.textContent=letter;
    el.classList.add("p2");
  }
}

/* AI LOGIC */
function aiMove(){
  if(!active) return;

  // Try win
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!board[r][c]){
        board[r][c]=word[turn%3];
        if(checkWin()){ placeMove(r,c); endGame(); return;}
        board[r][c]="";
      }
    }
  }

  // Try block
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!board[r][c]){
        board[r][c]=word[(turn+1)%3];
        if(checkWin()){ board[r][c]=""; placeMove(r,c); nextTurn(); return;}
        board[r][c]="";
      }
    }
  }

  // Random
  let empty=[];
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!board[r][c]) empty.push([r,c]);
    }
  }
  let [r,c]=empty[Math.floor(Math.random()*empty.length)];
  placeMove(r,c);
  if(checkWin()){ endGame(); return;}
  nextTurn();
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

        let seq=[],cells=[];

        for(let i=0;i<3;i++){
          let nr=r+dr*i,nc=c+dc*i;
          if(nr<0||nc<0||nr>=size||nc>=size) break;
          seq.push(board[nr][nc]);
          cells.push([nr,nc]);
        }

        if(seq.length===3){
          let s=seq.join("");
          let rev=seq.slice().reverse().join("");

          if(s===word || rev===word){
            highlight(cells);
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

/* HIGHLIGHT */
function highlight(cells){
  cells.forEach(([r,c])=>{
    gridEl.children[r*size+c].classList.add("win");
  });
}

/* BUTTONS */
document.getElementById("play-again").onclick=init;

document.getElementById("reset").onclick=()=>{
  game.classList.remove("active");
  setup.classList.add("active");
  score={1:0,2:0};
};
