import type { AppDispatch, RootState } from "@/store";
import { saveDaliNetwork } from "@/modules/DaliDesigner/store/daliThunks";

export class AutoSaveManager {
  private timer: number | null = null;

  constructor(private intervalMs = 30_000) {}

  start(getState: () => RootState, dispatch: AppDispatch): void {
    this.stop();
    this.timer = window.setInterval(() => {
      const s = getState().dali;
      if (s.dirty && s.status !== "saving") {
        dispatch(saveDaliNetwork());
      }
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer != null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}