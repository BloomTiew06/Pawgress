/** Calendar day in local time, formatted YYYY-MM-DD. */
export type ISODate = string;

export type AnimalId = 'cat' | 'pup' | 'bunny' | 'cub';
export type Mood = 'thriving' | 'okay' | 'sad';
export type Stage = 'baby' | 'kid' | 'teen' | 'grown';

export type HabitIcon =
  | 'water' | 'pencil' | 'run' | 'book' | 'moon'
  | 'leaf' | 'apple' | 'sun' | 'heart' | 'star';

export interface Habit {
  id: string;
  name: string;
  icon: HabitIcon;
  /** How many check-ins make the habit "done" for a day. */
  target: number;
  createdOn: ISODate;
  /** Habits are archived instead of deleted so past days keep their scores. */
  archivedOn?: ISODate;
}

/** date -> habitId -> number of check-ins that day */
export type HabitLog = Record<ISODate, Record<string, number>>;

export type SpendKind = 'toy' | 'game';

export interface PetEventRecord {
  type: SpendKind | 'pet';
  date: ISODate;
  /** Treats spent. Petting is free, so 0. */
  cost: number;
  /** Mini-game score, when type is 'game'. */
  score?: number;
}

export interface Pet {
  animal: AnimalId;
  name: string;
  adoptedOn: ISODate;
}

export interface GameState {
  pet: Pet;
  habits: Habit[];
  log: HabitLog;
  events: PetEventRecord[];
}

export type ReactionKind =
  | 'greetThriving' | 'greetOkay' | 'greetSad'
  | 'habitTap' | 'habitDone' | 'dayDone' | 'welcomeBack'
  | 'petted' | 'toy' | 'gameEnd' | 'stageUp';
