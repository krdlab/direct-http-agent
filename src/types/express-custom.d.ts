/// <reference types="express" />

declare namespace Express {
  export interface Request {
    client?: any  // TOOD: DirectClient
  }
}