/**
 * Servizio per pre-calcolare i layout masonry per diversi breakpoint
 * Replica l'algoritmo del frontend MasonryGrid.tsx
 */
export class MasonryLayoutGenerator {
  // Breakpoint fissi per cui calcolare i layout
  static BREAKPOINTS = [320, 375, 768, 1024, 1440];

  /**
   * Ottiene il gap in base alla larghezza del container
   */
  static getGap(containerWidth) {
    if (containerWidth >= 1024) return 18;
    if (containerWidth >= 768) return 14;
    return 12;
  }

  /**
   * Ottiene la target height in base alla larghezza del container
   */
  static getTargetHeight(containerWidth) {
    if (containerWidth >= 1024) return 280;
    if (containerWidth >= 768) return 220;
    return 160;
  }

  /**
   * Calcola il layout masonry per una specifica larghezza
   * Replica l'algoritmo di MasonryGrid.tsx (righe 50-96)
   */
  static calculateLayout(ratios, containerWidth, maxRows = null) {
    if (!containerWidth || ratios.length === 0) return [];

    const gap = this.getGap(containerWidth);
    const targetHeight = this.getTargetHeight(containerWidth);
    const rows = [];
    let current = [];
    let sumRatio = 0;
    const maxScaleUp = 1.35;
    const minScaleDown = 0.7;

    for (let i = 0; i < ratios.length; i++) {
      const ratio = Math.max(0.2, Math.min(4, ratios[i] ?? 1.5));
      current.push({ index: i, ratio });
      sumRatio += ratio;
      const rowWidthAtTarget = sumRatio * targetHeight + gap * (current.length - 1);

      if (rowWidthAtTarget >= containerWidth) {
        // Calcola altezza che riempie esattamente la riga
        let height = (containerWidth - gap * (current.length - 1)) / sumRatio;
        const scale = height / targetHeight;
        if (scale > maxScaleUp) height = targetHeight * maxScaleUp;
        if (scale < minScaleDown) height = targetHeight * minScaleDown;
        rows.push({ height, items: current });

        if (maxRows && rows.length >= maxRows) {
          return rows;
        }
        current = [];
        sumRatio = 0;
      }
    }

    // Ultima riga: se ha almeno 2 elementi, giustifica per riempire tutta la larghezza
    if (current.length > 0) {
      if (current.length >= 2) {
        let height = (containerWidth - gap * (current.length - 1)) / sumRatio;
        const scale = height / targetHeight;
        if (scale > maxScaleUp) height = targetHeight * maxScaleUp;
        if (scale < minScaleDown) height = targetHeight * minScaleDown;
        if (!maxRows || rows.length < maxRows) {
          rows.push({ height, items: current });
        }
      } else {
        if (!maxRows || rows.length < maxRows) {
          rows.push({ height: targetHeight, items: current });
        }
      }
    }

    return rows;
  }

  /**
   * Genera layouts per tutti i breakpoint
   */
  static generateLayoutsForBreakpoints(ratios, maxRows = null) {
    const layouts = {};
    
    for (const breakpoint of this.BREAKPOINTS) {
      layouts[breakpoint] = this.calculateLayout(ratios, breakpoint, maxRows);
    }

    return layouts;
  }

  /**
   * Genera tutti i layout necessari per l'applicazione
   * @param {Array} projects - Array di progetti con le loro gallery
   * @param {Object} imageMeta - Oggetto con i metadati delle immagini (ratio, placeholder)
   */
  static generateAllLayouts(projects, imageMeta) {
    const layouts = {};

    // 1. Gallery completa (tutte le foto di tutti i progetti)
    const allPhotos = projects.flatMap(p => p.gallery);
    const allRatios = allPhotos.map(photo => {
      const meta = imageMeta[photo.src];
      return meta?.ratio || 1.5;
    });
    layouts['gallery-full'] = this.generateLayoutsForBreakpoints(allRatios);

    // 2. Gallery preview (prime 8 foto per la home, max 2 righe)
    const previewPhotos = allPhotos.slice(0, 8);
    const previewRatios = previewPhotos.map(photo => {
      const meta = imageMeta[photo.src];
      return meta?.ratio || 1.5;
    });
    layouts['gallery-preview'] = this.generateLayoutsForBreakpoints(previewRatios, 2);

    // 3. Layout per ogni singolo progetto
    for (const project of projects) {
      const projectRatios = project.gallery.map(photo => {
        const meta = imageMeta[photo.src];
        return meta?.ratio || 1.5;
      });
      layouts[`project-${project.slug}`] = this.generateLayoutsForBreakpoints(projectRatios);
    }

    return layouts;
  }
}

