(async () => {
  // Force deterministic stub
  process.env.DETERMINISTIC_LLM = '1'

  try {
    // Import evaluation module (ts-node will transpile on the fly)
    // Use require to avoid ESM import extension issues in ts-node.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { runEvaluation, formatReport } = require('../lib/compiler/evaluation')

    console.log('Running deterministic evaluation (DETERMINISTIC_LLM=1)')
    const report = await runEvaluation()

    console.log(formatReport(report))

    // Also write JSON summary to stdout
    console.log('JSON_REPORT_START')
    console.log(JSON.stringify(report, null, 2))
    console.log('JSON_REPORT_END')
  } catch (err) {
    console.error('Evaluation failed:', err)
    process.exitCode = 1
  }
})()
