import { Every } from './types';
import { cReduce } from './reduce';

export const cEvery: Every = Array.prototype.every
    ? (fn, array) => {
          return Array.prototype.every.call(array, fn);
      }
    : (fn, array) =>
          cReduce(
              (flag: boolean, value) => {
                  return flag ? fn(value) : false;
              },
              true,
              array,
          );
