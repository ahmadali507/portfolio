import type { EngineContext, WorldPart } from '../types';

/** Direction A world. Step 1 shell: composes into the Engine and renders the clear color only. */
export class RequestPath implements WorldPart {
  private readonly ctx: EngineContext;

  constructor(ctx: EngineContext) {
    this.ctx = ctx;
    this.ctx.camera.position.set(0, 0, 10);
  }

  update(): boolean {
    return false;
  }

  resize(): void {}

  mount(): void {
    this.ctx.invalidate();
  }

  unmount(): void {}

  setTier(): void {}

  dispose(): void {}
}
