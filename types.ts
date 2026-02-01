
export interface UserData {
  name: string;
  smiles: number;
  scans: number;
}

export enum BotState {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  LISTENING = 'LISTENING',
  DESTRUCTING = 'DESTRUCTING',
  DEAD = 'DEAD'
}
