/* eslint-disable no-undef */
import { Component, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Player = 'X' | 'O';
type Cell = Player | null;
type GameMode = 'pvp' | 'ai';
type GameStatus = 'idle' | 'in_progress' | 'won' | 'draw';

interface MoveResult {
  winner: Player | null;
  winningLine: number[] | null;
  isDraw: boolean;
}

// PUBLIC_INTERFACE
@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  /** App title displayed in header */
  // PUBLIC_INTERFACE
  title = 'Tic Tac Toe';

  // Game state signals
  private readonly emptyBoard: Cell[] = Array(9).fill(null);
  board = signal<Cell[]>([...this.emptyBoard]);
  currentPlayer = signal<Player>('X');
  gameMode = signal<GameMode>('pvp');
  status = signal<GameStatus>('idle');
  winner = signal<Player | null>(null);
  winningLine = signal<number[] | null>(null);

  // Derived state
  // PUBLIC_INTERFACE
  turnText = computed(() => {
    const nameMap: Record<Player, string> = { X: 'Knight', O: 'Queen' };
    if (this.status() === 'won') {
      const w = this.winner();
      return `Winner: ${w ? nameMap[w] : ''}`;
    }
    if (this.status() === 'draw') {
      return `It's a draw`;
    }
    if (this.status() === 'idle') {
      return `Press Start to play`;
    }
    return `Turn: ${nameMap[this.currentPlayer()]}`;
  });

  // Ensure AI moves after player's turn in AI mode
  constructor() {
    effect(() => {
      // Trigger AI if conditions match
      if (this.status() === 'in_progress' && this.gameMode() === 'ai' && this.currentPlayer() === 'O') {
        // Minimal delay for smoother UX
        const schedule = (typeof setTimeout !== 'undefined' ? setTimeout : (fn: Function, _t: number) => fn());
        schedule(() => this.aiMove(), 250);
      }
    });
  }

  // PUBLIC_INTERFACE
  startGame(): void {
    /** Start or restart a game with the current mode and reset all state. */
    this.board.set([...this.emptyBoard]);
    this.currentPlayer.set('X');
    this.status.set('in_progress');
    this.winner.set(null);
    this.winningLine.set(null);
  }

  // PUBLIC_INTERFACE
  setMode(mode: GameMode): void {
    /** Change game mode (PvP or vs AI). Resets the game to avoid inconsistent state. */
    this.gameMode.set(mode);
    this.startGame();
  }

  // PUBLIC_INTERFACE
  handleCellClick(index: number): void {
    /** Handle a user clicking a cell. Applies move if valid and advances game. */
    if (this.status() !== 'in_progress') return;
    if (this.board()[index] !== null) return;

    const newBoard = [...this.board()];
    newBoard[index] = this.currentPlayer();
    this.board.set(newBoard);

    const verdict = this.evaluateBoard(newBoard);
    if (verdict.winner) {
      this.winner.set(verdict.winner);
      this.winningLine.set(verdict.winningLine);
      this.status.set('won');
      return;
    }
    if (verdict.isDraw) {
      this.status.set('draw');
      return;
    }

    // Switch player
    this.currentPlayer.set(this.currentPlayer() === 'X' ? 'O' : 'X');
  }

  private evaluateBoard(board: Cell[]): MoveResult {
    /** Check board for win/draw state */
    const lines = [
      [0,1,2],[3,4,5],[6,7,8], // rows
      [0,3,6],[1,4,7],[2,5,8], // cols
      [0,4,8],[2,4,6]          // diags
    ];
    for (const line of lines) {
      const [a,b,c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], winningLine: line, isDraw: false };
      }
    }
    const isDraw = board.every(c => c !== null);
    return { winner: null, winningLine: null, isDraw };
  }

  // Simple AI using a heuristic: win > block > center > corner > side
  private aiMove(): void {
    if (this.status() !== 'in_progress') return;
    const board = [...this.board()];
    const ai: Player = 'O';
    const human: Player = 'X';

    const emptyIdx = (b: Cell[]) => b.map((v,i)=> v===null ? i : -1).filter(i=> i>=0);
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    const tryComplete = (p: Player): number | null => {
      for (const [a,b,c] of lines) {
        const line = [board[a], board[b], board[c]];
        const countP = line.filter(v => v === p).length;
        const countE = line.filter(v => v === null).length;
        if (countP === 2 && countE === 1) {
          const locs = [a,b,c];
          const idx = locs[line.indexOf(null)];
          return idx;
        }
      }
      return null;
    };

    // 1. Win if possible
    let move = tryComplete(ai);
    // 2. Block opponent
    if (move === null) move = tryComplete(human);
    // 3. Take center
    if (move === null && board[4] === null) move = 4;
    // 4. Take a corner
    const corners = [0,2,6,8];
    if (move === null) {
      const availableCorners = corners.filter(i => board[i] === null);
      if (availableCorners.length) move = availableCorners[Math.floor(Math.random()*availableCorners.length)];
    }
    // 5. Take any side
    const sides = [1,3,5,7];
    if (move === null) {
      const availableSides = sides.filter(i => board[i] === null);
      if (availableSides.length) move = availableSides[Math.floor(Math.random()*availableSides.length)];
    }

    if (move !== null) {
      this.handleCellClick(move);
    }
  }

  // PUBLIC_INTERFACE
  isWinningCell(index: number): boolean {
    /** Returns true if a cell index is part of the winning line. */
    return !!this.winningLine() && this.winningLine()!.includes(index);
  }

  // PUBLIC_INTERFACE
  canInteract(): boolean {
    /** True when user can click cells */
    return this.status() === 'in_progress';
  }
}
