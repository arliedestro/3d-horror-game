export enum GameState {
  Title,
  Playing,
  Paused,
  GameOver
}

export class GameStateMachine {
  public currentState: GameState = GameState.Title;

  setState(newState: GameState) {
    console.log(`GameState transition: ${GameState[this.currentState]} → ${GameState[newState]}`);
    this.currentState = newState;
  }
}