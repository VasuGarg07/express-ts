export class ApiError extends Error {
  statusCode: number;
  data?: object;

  constructor(statusCode: number, message: string, data?: object) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}