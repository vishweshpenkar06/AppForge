export interface ExecutionMetrics {
  startTime: number
  endTime?: number
  duration?: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costEstimate?: number
}

export interface StageMetadata {
  stageName: string
  startTime: number
  endTime?: number
  duration?: number
  inputTokens: number
  outputTokens: number
  retriesAttempted: number
  success: boolean
  errorMessage?: string
}

export class ExecutionContext {
  jobId: string
  mode: 'fast' | 'balanced' | 'precise'
  stages: StageMetadata[] = []
  metrics: ExecutionMetrics

  constructor(jobId: string, mode: 'fast' | 'balanced' | 'precise') {
    this.jobId = jobId
    this.mode = mode
    this.metrics = {
      startTime: Date.now(),
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    }
  }

  recordStage(
    stageName: string,
    success: boolean,
    inputTokens: number = 0,
    outputTokens: number = 0,
    errorMessage?: string,
    retriesAttempted: number = 0
  ) {
    const now = Date.now()
    const stageMeta: StageMetadata = {
      stageName,
      startTime: this.stages.length > 0 ? now : this.metrics.startTime,
      duration: 0,
      inputTokens,
      outputTokens,
      retriesAttempted,
      success,
      errorMessage,
    }

    if (this.stages.length > 0) {
      const lastStage = this.stages[this.stages.length - 1]
      stageMeta.startTime = lastStage.endTime || now
    }

    stageMeta.endTime = now
    stageMeta.duration = stageMeta.endTime - stageMeta.startTime

    this.metrics.inputTokens += inputTokens
    this.metrics.outputTokens += outputTokens
    this.metrics.totalTokens = this.metrics.inputTokens + this.metrics.outputTokens

    this.stages.push(stageMeta)

    console.log(
      `[Execution] Stage: ${stageName} | Success: ${success} | Duration: ${stageMeta.duration}ms | Tokens: ${inputTokens + outputTokens}`
    )
  }

  finalize() {
    this.metrics.endTime = Date.now()
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime
    // Rough estimate: 1M input tokens = $3, 1M output tokens = $15 (Claude pricing)
    this.metrics.costEstimate =
      (this.metrics.inputTokens / 1000000) * 3 + (this.metrics.outputTokens / 1000000) * 15
  }

  getSummary() {
    return {
      jobId: this.jobId,
      mode: this.mode,
      totalDuration: this.metrics.duration || Date.now() - this.metrics.startTime,
      totalTokens: this.metrics.totalTokens,
      estimatedCost: this.metrics.costEstimate,
      successfulStages: this.stages.filter((s) => s.success).length,
      failedStages: this.stages.filter((s) => !s.success).length,
      stages: this.stages.map((s) => ({
        name: s.stageName,
        success: s.success,
        duration: s.duration,
        tokens: s.inputTokens + s.outputTokens,
      })),
    }
  }
}
