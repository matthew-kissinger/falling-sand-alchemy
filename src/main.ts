// Entry point. The sim core (src/sim/) stays pure and framework-free;
// presentation (src/render/, src/audio/, src/ui/) consumes it.
// Pre-v0.1 placeholder until the build plan is aligned — see ANALYSIS.md / SIM_AUDIT.md.

const canvas = document.querySelector<HTMLCanvasElement>('#scene')
if (!canvas) throw new Error('missing #scene canvas')

function fit(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas!.width = Math.max(1, Math.round(canvas!.clientWidth * dpr))
  canvas!.height = Math.max(1, Math.round(canvas!.clientHeight * dpr))
}
addEventListener('resize', fit)
fit()
