import * as long from '../src/schema-generation/litematica/long';
import 'jest';

describe('long bitwise operations', () => {
  test('it should correctly left-shift long numbers', () => {
    expect(long.shiftLeft([0, 4294967295], 32)).toEqual([-1, 0]);
    expect(long.shiftLeft([0, 3], 32)).toEqual([3, 0]);
    expect(long.shiftLeft([0, 3], 33)).toEqual([6, 0]);
    expect(long.shiftLeft([0, 3], 31)).toEqual([1, -2147483648]);
  });

  test('it should correctly right-shift long numbers', () => {
    expect(long.shiftRight([1, 0], 32)).toEqual([0, 1]);
    expect(long.shiftRight([1, 0], 1)).toEqual([0, -2147483648]);
    expect(long.shiftRight([3, 0], 1)).toEqual([1, -2147483648]);
  });
});
