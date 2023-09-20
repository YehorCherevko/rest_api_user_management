export interface IDatabaseConnection {
  connect(): Promise<void>;
}
