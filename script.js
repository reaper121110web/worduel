const setup = document.getElementById("setup-screen") || document.getElementById("setup");
const game = document.getElementById("game-screen") || document.getElementById("game");
const gridEl = document.getElementById("grid");

let word="", size=3, board=[];
let turn=0, player=1, active=true;
let mode="pvp", difficulty="easy";

/* START */
document.getElementById("start-btn")?.addEventListener("click", startGame);
document.getElementById("start")?.addEventListener("click", startGame);

function startGame(){
  const input=(document.getElementById("word-input") || document.getElementById("word")).value.toUpperCase();

  if(!/^[A-Z]{3}$/.test(input)){
    alert("Enter exactly 3 letters");
    return;
  }

  word=input;
  size=+(document.getElementById("grid-size") || document.getElementById("size")).value;
  mode=(document.getElementById("mode")?.value) || "pvp";
  difficulty=(document.getElementById("difficulty")?.value) || "easy";

  setup.classList.remove("active");
  game.classList.add("active");

  init();
}

/* INIT */
function init(){
  board=Array.from({length:size},()=>Array(size).fill(""));
  gridEl.innerHTML="";
  gridEl.style.gridTemplateColumns=`repeat(${size},1fr)`;

  turn=0;
  player=1;
  active=true;

  document.getElementById("winner-display")?.textContent="";
  document.getElementById("winner")?.textContent="";

  updateTurn();

  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      const cell=document.createElement("div");
      cell.className="cell";
      cell.onclick=()=>handleMove(r,c,cell);
      gridEl.appendChild(cell);
    }
  }
}

/* PLAYER MOVE */
function handleMove(r,c,cell){
  if(!active || board[r][c]) return;

  makeMove(board, r, c, turn, cell);

  if(checkWin(board)){
    endGame();
    return;
  }

  nextTurn();

  if(mode==="ai" && player===2){
    setTimeout(aiMove,150);
  }
}

/* PLACE */
function makeMove(b,r,c,t,cell){
  const letter=word[t%3];
  b[r][c]=letter;

  const el=cell || gridEl.children[r*size+c];
  el.textContent=letter;
  el.classList.add(player===1?"p1":"p2");
}

/* TURN */
function nextTurn(){
  turn++;
  player = player===1 ? 2 : 1;
  updateTurn();
}

function updateTurn(){
  const el=document.getElementById("turn-indicator") || document.getElementById("turn");
  if(el){
    el.textContent = `Player ${player} → ${word[turn%3]}`;
  }
}

/* AI */
function aiMove(){
  let move;

  if(difficulty==="easy"){
    move = randomMove(board);
  }
  else if(difficulty==="medium"){
    move = findImmediateWinOrBlock(board) || randomMove(board);
  }
  else if(difficulty==="hard"){
    move = minimaxRoot(3);
  }
  else{
    move = minimaxRoot(5); // strongest practical
  }

  if(move){
    makeMove(board, move.r, move.c, turn);

    if(checkWin(board)){
      endGame();
      return;
    }

    nextTurn();
  }
}

/* RANDOM */
function randomMove(b){
  const moves=[];
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!b[r][c]) moves.push({r,c});
    }
  }
  return moves[Math.floor(Math.random()*moves.length)];
}

/* MEDIUM LOGIC */
function findImmediateWinOrBlock(b){
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!b[r][c]){
        b[r][c]=word[turn%3];
        if(checkWin(b)){
          b[r][c]="";
          return {r,c};
        }
        b[r][c]="";
      }
    }
  }
  return null;
}

/* MINIMAX ROOT */
function minimaxRoot(depth){
  let bestScore=-Infinity;
  let bestMove=null;

  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!board[r][c]){
        board[r][c]=word[turn%3];

        let score=minimax(board, turn+1, depth-1, false);

        board[r][c]="";

        if(score>bestScore){
          bestScore=score;
          bestMove={r,c};
        }
      }
    }
  }

  return bestMove;
}

/* MINIMAX */
function minimax(b, t, depth, isMax){
  if(checkWin(b)){
    return isMax ? -100 : 100;
  }

  if(depth===0){
    return evaluate(b);
  }

  let best = isMax ? -Infinity : Infinity;

  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(!b[r][c]){
        b[r][c]=word[t%3];

        let val = minimax(b, t+1, depth-1, !isMax);

        b[r][c]="";

        if(isMax) best = Math.max(best,val);
        else best = Math.min(best,val);
      }
    }
  }

  return best;
}

/* EVALUATION */
function evaluate(b){
  let score=0;

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
            score+=50;
          }else{
            let match=0;
            for(let ch of seq){
              if(word.includes(ch)) match++;
            }

            if(match===2) score+=5;
            else if(match===1) score+=1;
          }
        }
      }
    }
  }

  return score;
}

/* WIN */
function checkWin(b){
  const dirs=[[0,1],[1,0],[1,1],[1,-1]];

  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      for(let [dr,dc] of dirs){
        let seq=[], cells=[];

        for(let i=0;i<3;i++){
          let nr=r+dr*i,nc=c+dc*i;
          if(nr<0||nc<0||nr>=size||nc>=size) break;

          seq.push(b[nr][nc]);
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

/* HIGHLIGHT */
function highlight(cells){
  cells.forEach(([r,c])=>{
    gridEl.children[r*size+c].classList.add("win");
  });
}

/* END */
function endGame(){
  active=false;

  const el=document.getElementById("winner-display") || document.getElementById("winner");
  if(el){
    el.textContent = `Player ${player} wins`;
  }
}

/* BUTTONS */
document.getElementById("play-again")?.addEventListener("click", init);
document.getElementById("again")?.addEventListener("click", init);

document.getElementById("reset")?.addEventListener("click", ()=>{
  game.classList.remove("active");
  setup.classList.add("active");
});
