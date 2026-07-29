export const DIAGNOSTIC_EXPORT_STATUS = {
  EXPORTED: 'exported',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const satisfies Record<string, string>;

export type DiagnosticLogExportResult =
  | {
    status: typeof DIAGNOSTIC_EXPORT_STATUS.EXPORTED;
    archivePath: string;
    includedLogFiles: number;
  }
  | {
    status: typeof DIAGNOSTIC_EXPORT_STATUS.CANCELLED;
  }
  | {
    status: typeof DIAGNOSTIC_EXPORT_STATUS.FAILED;
    error: string;
  };
