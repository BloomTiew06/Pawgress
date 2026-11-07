import type { AnimalId, ReactionKind } from './types';

export interface AnimalInfo {
  id: AnimalId;
  label: string;
  role: string;
  blurb: string;
  suggestedNames: string[];
}

export const ANIMALS: AnimalInfo[] = [
  { id: 'cat', label: 'Cat', role: 'the cool one', blurb: 'Acts unbothered. Secretly your biggest fan.', suggestedNames: ['Miso', 'Pepper', 'Juniper'] },
  { id: 'pup', label: 'Pup', role: 'the cheerleader', blurb: 'Celebrates every single glass of water.', suggestedNames: ['Biscuit', 'Waffles', 'Scout'] },
  { id: 'bunny', label: 'Bunny', role: 'the gentle worrier', blurb: 'Soft, kind, and happiest when you go slow.', suggestedNames: ['Clover', 'Mochi', 'Pip'] },
  { id: 'cub', label: 'Bear cub', role: 'the cozy one', blurb: 'Never in a rush. Always up for a snack.', suggestedNames: ['Hazel', 'Bramble', 'Toast'] },
];

export const animalInfo = (id: AnimalId) => ANIMALS.find((a) => a.id === id)!;

type Lines = Record<ReactionKind, string[]>;

const LINES: Record<AnimalId, Lines> = {
  cat: {
    greetThriving: ['You’re here. Good. I was being extremely calm about it.', '*stretches* Today feels like a good day to be excellent.'],
    greetOkay: ['Hm. A little water wouldn’t hurt either of us.', 'I’m fine. I’d be finer if you did a habit.'],
    greetSad: ['I’m not sulking. I’m resting my ears. One habit might help them.', 'It’s been quiet. Want to do one small thing together?'],
    habitTap: ['*slow blink*', 'Acceptable.', 'Noted.'],
    habitDone: ['*slow blink* Fine. That one was good.', 'Done? I knew you would. I just didn’t say.'],
    dayDone: ['Everything, done. I’m purring. Don’t tell anyone.', 'A perfect day. I’ll allow a small celebration.'],
    welcomeBack: ['Oh. You’re back. I wasn’t waiting by the door or anything.', 'There you are. I saved the sunny spot. Obviously.'],
    petted: ['...okay, one more.', '*purrs against my will*', 'Behind the ears. Yes. There.'],
    toy: ['I am only chasing this ironically.', 'Again. Throw it again.'],
    gameEnd: ['{score} stars. I let you help.'],
    stageUp: ['I’m bigger now. Dignified, even.'],
  },
  pup: {
    greetThriving: ['YOU’RE HERE! Best morning! Best you!', 'Hi hi hi! Ready to win today?'],
    greetOkay: ['Hi! Want to do a habit? I’ll cheer SO loud.', 'Let’s go go go! Just one thing first?'],
    greetSad: ['I missed you! Can we do one little thing together?', 'My tail’s a bit slow today. One habit would wake it up!'],
    habitTap: ['YES!', 'Go go go!', 'One more!'],
    habitDone: ['You did it! Best human ever!', 'Done! I’m doing zoomies!'],
    dayDone: ['EVERYTHING?! Zoomies! Zoomies for everyone!', 'Perfect day! I’m so proud I could burst!'],
    welcomeBack: ['YOU’RE HERE! I missed you so much. Let’s go, let’s go!', 'You came back! Best day ever!'],
    petted: ['Ears! Do the ears!', '*happy wiggle*', 'More! More pets!'],
    toy: ['BALL! BALL! BALL!', 'Again! Again!'],
    gameEnd: ['{score} stars! We’re a TEAM!'],
    stageUp: ['I grew! Look how big my paws are!'],
  },
  bunny: {
    greetThriving: ['Oh good, you’re here. Everything feels calm today.', 'We’re doing really well, aren’t we?'],
    greetOkay: ['Maybe a glass of water? Just to be safe.', 'Hello. Should we start with something small?'],
    greetSad: ['I kept your spot warm. Want to start with one small thing?', 'It’s okay. We can begin again, slowly.'],
    habitTap: ['Phew.', 'Good, good.', 'One step.'],
    habitDone: ['Phew. That one’s done. We’re doing okay.', 'Oh, well done. My ears feel lighter.'],
    dayDone: ['All of it? Oh my. Happy tears.', 'A whole day, done. I feel so safe.'],
    welcomeBack: ['You’re back. I kept your spot warm. Want to start with one small thing?', 'Oh, it’s you! I hoped you’d come. Let’s go gently.'],
    petted: ['Mm. That’s nice.', '*nose twitch*', 'Soft paws, soft day.'],
    toy: ['Is it safe? ...It’s fun!', 'Oh! Oh! I caught it!'],
    gameEnd: ['{score} stars! I only dropped a few.'],
    stageUp: ['I’m growing up. A little braver every day.'],
  },
  cub: {
    greetThriving: ['Morning. Feels like a honey kind of day.', 'Mm. Everything’s cozy today.'],
    greetOkay: ['Hey. Stretch, sip, slow start?', 'No rush. What’s first?'],
    greetSad: ['Hey, you. Let’s take it slow. One small thing?', 'Bit of a sleepy week. We can wake up together.'],
    habitTap: ['Mm, nice.', 'Good.', 'There we go.'],
    habitDone: ['Mm. Good one. Snack after?', 'That’s done. Cozy.'],
    dayDone: ['Whole day done. Nap earned.', 'Look at us. Full and happy.'],
    welcomeBack: ['There you are. No rush. Let’s ease back in.', 'Missed you. Kettle’s on. Let’s start small.'],
    petted: ['*rumbly hum*', 'Mm, right behind the ears.'],
    toy: ['Ooh, a roll-y thing.', 'Got it. Probably.'],
    gameEnd: ['{score} stars. Honey for days.'],
    stageUp: ['Grew a bit. Need a bigger blanket.'],
  },
};

let counter = 0;

/** Pick a line, rotating through variants so repeats are rare. */
export function lineFor(animal: AnimalId, kind: ReactionKind, vars: Record<string, string | number> = {}): string {
  const options = LINES[animal][kind];
  const line = options[counter++ % options.length];
  return line.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
