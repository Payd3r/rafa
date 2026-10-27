type Dimensions = { ratio?: number; width?: number; height?: number }
export function photoRatio(photo: Dimensions) {
  const ratio = photo.ratio || (photo.width && photo.height ? photo.width / photo.height : 0.8)
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 0.8
}

type Placement = { index: number; column: number; span: number; top: number; height: number }
type Packing = { bottoms: number[]; remaining: number[]; placed: Placement[]; waste: number; orderCost: number; score: number }

export function masonryLayout(photos: Dimensions[], width: number, gap: number, columns = 2) {
  if (!photos.length) return { items: [], order: [], height: 0 }
  const columnWidth = (width - gap * (columns - 1)) / columns
  const gutter = gap / columnWidth
  const shapes = photos.map(photo => {
    const ratio = photoRatio(photo)
    const span = ratio > 1.1 ? Math.min(2, columns) : 1
    return { ratio, span, height: (span + (span - 1) * gutter) / ratio }
  })
  // Search several possible arrangements, keeping the opening photograph first.
  // The score penalizes holes and an uneven bottom, rather than original file order.
  let beam: Packing[] = [{bottoms: Array<number>(columns).fill(0), remaining: shapes.map((_, i) => i), placed: [], waste: 0, orderCost: 0, score: 0}]
  for (let step = 0; step < photos.length; step++) {
    const candidates: Packing[] = []
    for (const state of beam) {
      const triedShapes = new Set<string>()
      for (const index of state.remaining) {
        if (step === 0 && index !== 0) continue
        const shape = shapes[index]
        const shapeKey = `${shape.span}:${shape.ratio.toFixed(3)}`
        if (triedShapes.has(shapeKey)) continue
        triedShapes.add(shapeKey)
        for (let column = 0; column <= columns - shape.span; column++) {
          if (step === 0 && column !== 0) continue
          const top = Math.max(...state.bottoms.slice(column, column + shape.span))
          const bottoms = [...state.bottoms]
          let waste = state.waste
          for (let c = column; c < column + shape.span; c++) {
            waste += top - bottoms[c]
            bottoms[c] = top + shape.height + gutter
          }
          const remaining = state.remaining.filter(i => i !== index)
          const remainingArea = remaining.reduce((sum, i) => sum + (shapes[i].height + gutter) * shapes[i].span, 0)
          const height = Math.max(...bottoms)
          const spread = height - Math.min(...bottoms)
          const lowerBound = Math.max(height, (bottoms.reduce((a, b) => a + b, 0) + remainingArea) / columns)
          const orderCost = state.orderCost + Math.abs(index - step)
          const score = lowerBound + waste * 1.5 + spread * (remaining.length ? .05 : .2) + orderCost * .002
          candidates.push({bottoms, remaining, waste, orderCost, score, placed: [...state.placed, {index, column, span: shape.span, top, height: shape.height}]})
        }
      }
    }
    candidates.sort((a, b) => a.score - b.score)
    const seen = new Set<string>()
    beam = []
    const orientationCounts = new Map<number, number>()
    for (const candidate of candidates) {
      const key = candidate.remaining.join(',') + ':' + candidate.bottoms.map(h => h.toFixed(3)).join(',')
      if (seen.has(key)) continue
      const wides = candidate.placed.filter(item => item.span > 1).length
      if ((orientationCounts.get(wides) || 0) >= 8) continue
      seen.add(key)
      orientationCounts.set(wides, (orientationCounts.get(wides) || 0) + 1)
      beam.push(candidate)
      if (beam.length === 96) break
    }
  }
  const best = beam[0]
  const items = best.placed.map(item => ({
    index: item.index, column: item.column, span: item.span,
    left: item.column * (columnWidth + gap), top: item.top * columnWidth,
    width: columnWidth * item.span + gap * (item.span - 1),
    height: item.height * columnWidth, ratio: shapes[item.index].ratio,
  })).sort((a, b) => a.index - b.index)
  const order = [...items].sort((a, b) => a.top - b.top || a.left - b.left).map(item => item.index)
  return { items, order, height: Math.max(...best.bottoms) * columnWidth - gap }
}
