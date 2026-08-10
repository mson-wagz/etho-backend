export enum IngestionRunType {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
}

export enum IngestionStatus {
  STANDBY = 'standby',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ABORTED = 'aborted',
}
