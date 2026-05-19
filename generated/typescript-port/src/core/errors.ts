export class MbslError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MbslError";
  }
}
