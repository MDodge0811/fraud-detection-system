declare module 'ml' {
  export namespace Classification {
    export class LogisticRegression {
      constructor(options?: {
        numSteps?: number;
        learningRate?: number;
        regularization?: number;
      });
      train(features: number[][], labels: number[]): void;
      predict(features: number[]): number;
      predictProbability(features: number[]): number;
      static load(model: any): LogisticRegression;
      toJSON(): any;
    }
  }

  export namespace Matrix {
    export function transpose(matrix: number[][]): number[][];
    export function multiply(a: number[][], b: number[][]): number[][];
  }

  export namespace Random {
    export function random(min: number, max: number): number;
    export function randomInt(min: number, max: number): number;
  }
}
