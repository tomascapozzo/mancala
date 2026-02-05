import { BoardState, Player } from "./board.model";

export function createInitialBoard(): BoardState {
  return {
    pits: [
      4, 4, 4, 4, 4, 4, // Player 0 pits
      0,                // Player 0 store
      4, 4, 4, 4, 4, 4, // Player 1 pits
      0                 // Player 1 store
    ],
    currentPlayer: 0
  };
}

export function pitName(index: number): string {
  if (index === 6) return "a0";
  if (index === 13) return "b0";

  if (index >= 0 && index <= 5) return `a${index + 1}`;
  if (index >= 7 && index <= 12) return `b${index - 6}`;

  return "?";
}

export function cloneBoard(board: BoardState): BoardState {
  return {
    pits: [...board.pits],
    currentPlayer: board.currentPlayer
  };
}

export function getStoreIndex(player: Player){
  return player === 0 ? 6 : 13;
}

export function getOpponentStore(player: Player) {
  return player === 0 ? 13 : 6;
}

export function isPlayersPit(index: number, player: Player) {
  if (player === 0) return index >= 0 && index <= 5;
  return index >= 7 && index <= 12;
}

export function isValidMove(board: BoardState, pitIndex: number): boolean {
  return (
    isPlayersPit(pitIndex, board.currentPlayer) &&
    board.pits[pitIndex] > 0
  );
}

export function getValidMoves(board: BoardState): number[] {
  const moves: number[] = [];

  for (let i = 0; i < 14; i++) {
    if (isValidMove(board, i)) {
      moves.push(i);
    }
  }
  return moves;
}

export function applyMove(
  board: BoardState,
  pitIndex: number
): BoardState {

  if (!isValidMove(board, pitIndex)) {
    throw new Error("Invalid move");
  }

  const newBoard = cloneBoard(board);
  let seeds = newBoard.pits[pitIndex];
  newBoard.pits[pitIndex] = 0;

  let index = pitIndex;

  // Distribute seeds
 while (seeds > 0) {
  let next = (index + 1) % 14;

  // Never drop stones in opponent store
  if (next === getOpponentStore(board.currentPlayer)) {
    index = next;
    continue;
  }

  // Only allow own store if this is the LAST stone
  if (next === getStoreIndex(board.currentPlayer)) {
    if (seeds === 1) {
      newBoard.pits[next]++;
      index = next;
      seeds--;
    } else {
      index = next;
    }
    continue;
  }

  // Normal pit
  newBoard.pits[next]++;
  index = next;
  seeds--;
}

  const landedInOwnStore =
    index === getStoreIndex(board.currentPlayer);

  // CAPTURE (only if not store)
  if (
    !landedInOwnStore &&
    isPlayersPit(index, board.currentPlayer) &&
    newBoard.pits[index] === 1
  ) {
    const opposite = 12 - index;
    const captured = newBoard.pits[opposite];

    if (captured > 0) {
      newBoard.pits[opposite] = 0;
      newBoard.pits[index] = 0;

      newBoard.pits[getStoreIndex(board.currentPlayer)] +=
        captured + 1;
    }
  }

  // SWITCH TURN ONLY IF NO EXTRA TURN
 if (!landedInOwnStore) {
  newBoard.currentPlayer =
    board.currentPlayer === 0 ? 1 : 0;
}

// GAME OVER CHECK
if (isGameOver(newBoard)) {
  return collectRemainingStones(newBoard);
}

return newBoard;
}


export function isSideEmpty(board: BoardState, player: Player): boolean {
  const start = player === 0 ? 0 : 7;
  const end   = player === 0 ? 5 : 12;

  for (let i = start; i <= end; i++) {
    if (board.pits[i] > 0) return false;
  }
  return true;
}

export function isGameOver(board: BoardState): boolean {
  return isSideEmpty(board, 0) || isSideEmpty(board, 1);
}

export function collectRemainingStones(board: BoardState): BoardState {
  const newBoard = cloneBoard(board);

  // Player A side
  for (let i = 0; i <= 5; i++) {
    newBoard.pits[6] += newBoard.pits[i];
    newBoard.pits[i] = 0;
  }

  // Player B side
  for (let i = 7; i <= 12; i++) {
    newBoard.pits[13] += newBoard.pits[i];
    newBoard.pits[i] = 0;
  }

  return newBoard;
}

export function getWinner(board: BoardState): Player | "draw" {
  if (board.pits[6] > board.pits[13]) return 0;
  if (board.pits[13] > board.pits[6]) return 1;
  return "draw";
}

export function evaluateBoard(
  board: BoardState,
  aiPlayer: Player
): number {

  const aiStore =
    aiPlayer === 0 ? board.pits[6] : board.pits[13];

  const humanStore =
    aiPlayer === 0 ? board.pits[13] : board.pits[6];

  let aiSide = 0;
  let humanSide = 0;

  if (aiPlayer === 0) {
    for (let i = 0; i <= 5; i++) {
      aiSide += board.pits[i];
      humanSide += board.pits[i + 7];
    }
  } else {
    for (let i = 7; i <= 12; i++) {
      aiSide += board.pits[i];
      humanSide += board.pits[i - 7];
    }
  }

  return (aiStore * 3 + aiSide) -
         (humanStore * 3 + humanSide);
}

export function minimax(
  board: BoardState,
  depth: number,
  maximizingPlayer: boolean,
  aiPlayer: Player
): number {

  if (depth === 0 || isGameOver(board)) {
    return evaluateBoard(board, aiPlayer);
  }

  const moves = getValidMoves(board);

  if (maximizingPlayer) {
    let bestScore = -Infinity;

    for (const move of moves) {
      const nextBoard = applyMove(board, move);

      const samePlayerTurn =
        nextBoard.currentPlayer === board.currentPlayer;

      const score = minimax(
        nextBoard,
        depth - 1,
        samePlayerTurn ? true : false,
        aiPlayer
      );

      bestScore = Math.max(bestScore, score);
    }

    return bestScore;
  }
  else {
    let bestScore = Infinity;

    for (const move of moves) {
      const nextBoard = applyMove(board, move);

      const samePlayerTurn =
        nextBoard.currentPlayer === board.currentPlayer;

      const score = minimax(
        nextBoard,
        depth - 1,
        samePlayerTurn ? false : true,
        aiPlayer
      );

      bestScore = Math.min(bestScore, score);
    }

    return bestScore;
  }
}

export function getBestMove(
  board: BoardState,
  aiPlayer: Player,
  depth: number = 5
): number {

  let bestScore = -Infinity;
  let bestMove = -1;

  for (const move of getValidMoves(board)) {
    const nextBoard = applyMove(board, move);

    const samePlayerTurn =
      nextBoard.currentPlayer === board.currentPlayer;

    const score = minimax(
      nextBoard,
      depth - 1,
      samePlayerTurn,
      aiPlayer
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

export function getDistributionPath(
  board: BoardState,
  pitIndex: number
): number[] {

  let seeds = board.pits[pitIndex];
  let index = pitIndex;
  const path: number[] = [];

  while (seeds > 0) {
    let next = (index + 1) % 14;

    // skip opponent store
    if (next === getOpponentStore(board.currentPlayer)) {
      index = next;
      continue;
    }

    path.push(next);
    index = next;
    seeds--;
  }

  return path;
}

export function getCaptureInfo(
  board: BoardState,
  pitIndex: number
): { from: number; to: number } | null {

  const path = getDistributionPath(board, pitIndex);
  const lastPit = path[path.length - 1];

  // landed in own pit?
  if (!isPlayersPit(lastPit, board.currentPlayer)) return null;

  if (board.pits[lastPit] !== 0) return null;

  const opposite = 12 - lastPit;

  if (board.pits[opposite] === 0) return null;

  return {
    from: opposite,
    to: getStoreIndex(board.currentPlayer)
  };
}

export function detectMove(
  before: BoardState,
  after: BoardState
): number | null {

  for (let i = 0; i < before.pits.length; i++) {
    if (
      before.pits[i] > after.pits[i] &&
      before.pits[i] > 0
    ) {
      return i;
    }
  }

  return null;
}





