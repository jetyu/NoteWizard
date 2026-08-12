export type HistoryDiffLineType =
  | 'unchanged'
  | 'added'
  | 'deleted'
  | 'modified-before'
  | 'modified-after';

export interface HistoryDiffLine {
  type: HistoryDiffLineType;
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

export interface HistoryDiffStats {
  added: number;
  deleted: number;
  modified: number;
}

export interface HistoryDiffResult {
  lines: HistoryDiffLine[];
  stats: HistoryDiffStats;
  hasChanges: boolean;
}

type RawDiffType = 'equal' | 'insert' | 'delete';

interface RawDiffLine {
  type: RawDiffType;
  content: string;
}

const MAX_EDIT_DISTANCE = 500;

function splitLines(content: string): string[] {
  if (content.length === 0) {
    return [];
  }

  return content.replace(/\r\n?/g, '\n').split('\n');
}

function getFrontierX(frontier: ReadonlyMap<number, number>, diagonal: number): number {
  return frontier.get(diagonal) ?? -1;
}

function buildFallbackDiff(beforeLines: string[], afterLines: string[]): RawDiffLine[] {
  return [
    ...beforeLines.map((content): RawDiffLine => ({ type: 'delete', content })),
    ...afterLines.map((content): RawDiffLine => ({ type: 'insert', content })),
  ];
}

function backtrackDiff(
  trace: Array<ReadonlyMap<number, number>>,
  beforeLines: string[],
  afterLines: string[],
): RawDiffLine[] {
  const result: RawDiffLine[] = [];
  let x = beforeLines.length;
  let y = afterLines.length;

  for (let distance = trace.length - 1; distance >= 0; distance -= 1) {
    const frontier = trace[distance];
    const diagonal = x - y;
    const previousDiagonal = diagonal === -distance
      || (diagonal !== distance
        && getFrontierX(frontier, diagonal - 1) < getFrontierX(frontier, diagonal + 1))
      ? diagonal + 1
      : diagonal - 1;
    const previousX = Math.max(0, getFrontierX(frontier, previousDiagonal));
    const previousY = previousX - previousDiagonal;

    while (x > previousX && y > previousY) {
      result.push({ type: 'equal', content: beforeLines[x - 1] });
      x -= 1;
      y -= 1;
    }

    if (distance === 0) {
      break;
    }

    if (x === previousX) {
      result.push({ type: 'insert', content: afterLines[y - 1] });
      y -= 1;
    } else {
      result.push({ type: 'delete', content: beforeLines[x - 1] });
      x -= 1;
    }
  }

  return result.reverse();
}

function buildRawDiff(beforeLines: string[], afterLines: string[]): RawDiffLine[] {
  if (beforeLines.length === 0) {
    return afterLines.map((content) => ({ type: 'insert', content }));
  }
  if (afterLines.length === 0) {
    return beforeLines.map((content) => ({ type: 'delete', content }));
  }

  const maximumDistance = beforeLines.length + afterLines.length;
  const frontier = new Map<number, number>();
  frontier.set(1, 0);
  const trace: Array<ReadonlyMap<number, number>> = [];

  for (let distance = 0; distance <= maximumDistance; distance += 1) {
    if (distance > MAX_EDIT_DISTANCE) {
      return buildFallbackDiff(beforeLines, afterLines);
    }

    trace.push(new Map(frontier));

    for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
      let x: number;
      if (
        diagonal === -distance
        || (diagonal !== distance
          && getFrontierX(frontier, diagonal - 1) < getFrontierX(frontier, diagonal + 1))
      ) {
        x = getFrontierX(frontier, diagonal + 1);
      } else {
        x = getFrontierX(frontier, diagonal - 1) + 1;
      }

      let y = x - diagonal;
      while (
        x < beforeLines.length
        && y < afterLines.length
        && beforeLines[x] === afterLines[y]
      ) {
        x += 1;
        y += 1;
      }

      frontier.set(diagonal, x);
      if (x >= beforeLines.length && y >= afterLines.length) {
        return backtrackDiff(trace, beforeLines, afterLines);
      }
    }
  }

  return buildFallbackDiff(beforeLines, afterLines);
}

function appendChangeBlock(
  lines: HistoryDiffLine[],
  deletedLines: RawDiffLine[],
  addedLines: RawDiffLine[],
  oldLineNumber: number,
  newLineNumber: number,
  stats: HistoryDiffStats,
): void {
  const modifiedCount = Math.min(deletedLines.length, addedLines.length);

  deletedLines.forEach((line, index) => {
    lines.push({
      type: index < modifiedCount ? 'modified-before' : 'deleted',
      content: line.content,
      oldLineNumber: oldLineNumber + index,
      newLineNumber: null,
    });
  });

  addedLines.forEach((line, index) => {
    lines.push({
      type: index < modifiedCount ? 'modified-after' : 'added',
      content: line.content,
      oldLineNumber: null,
      newLineNumber: newLineNumber + index,
    });
  });

  stats.modified += modifiedCount;
  stats.deleted += deletedLines.length - modifiedCount;
  stats.added += addedLines.length - modifiedCount;
}

export function createHistoryDiff(before: string, after: string): HistoryDiffResult {
  const rawDiff = buildRawDiff(splitLines(before), splitLines(after));
  const lines: HistoryDiffLine[] = [];
  const stats: HistoryDiffStats = { added: 0, deleted: 0, modified: 0 };
  let oldLineNumber = 1;
  let newLineNumber = 1;
  let index = 0;

  while (index < rawDiff.length) {
    const line = rawDiff[index];
    if (line.type === 'equal') {
      lines.push({
        type: 'unchanged',
        content: line.content,
        oldLineNumber,
        newLineNumber,
      });
      oldLineNumber += 1;
      newLineNumber += 1;
      index += 1;
      continue;
    }

    const deletedLines: RawDiffLine[] = [];
    const addedLines: RawDiffLine[] = [];
    while (index < rawDiff.length && rawDiff[index].type !== 'equal') {
      const changedLine = rawDiff[index];
      if (changedLine.type === 'delete') {
        deletedLines.push(changedLine);
      } else {
        addedLines.push(changedLine);
      }
      index += 1;
    }

    appendChangeBlock(
      lines,
      deletedLines,
      addedLines,
      oldLineNumber,
      newLineNumber,
      stats,
    );
    oldLineNumber += deletedLines.length;
    newLineNumber += addedLines.length;
  }

  return {
    lines,
    stats,
    hasChanges: stats.added > 0 || stats.deleted > 0 || stats.modified > 0,
  };
}
