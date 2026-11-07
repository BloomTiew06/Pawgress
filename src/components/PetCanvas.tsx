/** React wrapper around the PixiJS PetStage. React passes a view in and gets pet taps out. */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { ReactionKind } from '../engine/types';
import { useReducedMotion } from '../hooks';
import { PetStage, type PetView, type ToyId } from '../pet/PetStage';

export interface PetCanvasHandle {
  react(kind: ReactionKind): void;
  playToy(toy: ToyId): void;
}

interface Props {
  view: PetView;
  label: string;
  onPet(): void;
}

export const PetCanvas = forwardRef<PetCanvasHandle, Props>(function PetCanvas({ view, label, onPet }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<PetStage | null>(null);
  const viewRef = useRef(view);
  const onPetRef = useRef(onPet);
  const queued = useRef<ReactionKind[]>([]);
  const reducedMotion = useReducedMotion();
  viewRef.current = view;
  onPetRef.current = onPet;

  useEffect(() => {
    let cancelled = false;
    let created: PetStage | null = null;
    PetStage.create(host.current!, viewRef.current, { reducedMotion }).then((s) => {
      if (cancelled) {
        s.destroy();
        return;
      }
      created = s;
      stage.current = s;
      s.update(viewRef.current);
      s.onPet(() => onPetRef.current());
      queued.current.splice(0).forEach((k) => s.react(k));
    });
    return () => {
      cancelled = true;
      created?.destroy();
      stage.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    stage.current?.update(view);
  }, [view.animal, view.mood, view.stage]); // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(ref, () => ({
    react(kind) {
      if (stage.current) stage.current.react(kind);
      else queued.current.push(kind);
    },
    playToy(toy) {
      stage.current?.playToy(toy);
    },
  }));

  return <div className="pet-canvas" ref={host} role="img" aria-label={label} />;
});
