interface CountRow {
  readonly count: number;
}

export function readAggregateCount(rows: readonly CountRow[]): number {
  if (rows.length !== 1) {
    throw new Error("Database aggregate returned an invalid row count");
  }
  const row = rows[0];
  if (!row || !Number.isSafeInteger(row.count) || row.count < 0) {
    throw new Error("Database aggregate returned an invalid count");
  }
  return row.count;
}
