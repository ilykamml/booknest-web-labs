import type { Ref } from 'react';
import basket from '../../assets/basket.webp';
interface MotionStageProps {
  ordering: boolean;
  stageRef: Ref<HTMLDivElement>;
  basketRef: Ref<HTMLImageElement>;
  effectsRef: Ref<HTMLDivElement>;
}
export function MotionStage({ ordering, stageRef, basketRef, effectsRef }: MotionStageProps) {
  return (
    <>
      <div className="checkout-stage" ref={stageRef} hidden={!ordering} aria-hidden="true">
        <img className="basket" ref={basketRef} src={basket} alt="" width="1254" height="1254" />
      </div>
      <div className="effects" ref={effectsRef} aria-hidden="true" />
    </>
  );
}
