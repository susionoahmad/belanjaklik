import type { PipelineContext, PipelineStage } from '../types';

export class PipelineEngine {
  private stages: PipelineStage[] = [];

  registerStage(stage: PipelineStage): void {
    this.stages.push(stage);
  }

  getStages(): PipelineStage[] {
    return this.stages;
  }

  toggleStage(stageName: string, enabled: boolean): void {
    const stage = this.stages.find(s => s.name === stageName);
    if (stage) {
      stage.enabled = enabled;
    }
  }

  async execute(initialContext: PipelineContext): Promise<PipelineContext> {
    let context = { ...initialContext };
    console.log(`[PipelineEngine] Starting pipeline execution for session ${context.sessionId}`);

    for (const stage of this.stages) {
      if (!stage.enabled) {
        context.logs.push(`Stage skipped (disabled): ${stage.name}`);
        continue;
      }

      try {
        console.log(`[PipelineEngine] Executing stage: ${stage.name}`);
        context = await stage.execute(context);
        context.logs.push(`Stage completed: ${stage.name}`);
      } catch (err: any) {
        console.error(`[PipelineEngine] Stage ${stage.name} failed:`, err);
        context.errors.push(`Stage ${stage.name} error: ${err.message}`);
      }
    }

    return context;
  }
}
