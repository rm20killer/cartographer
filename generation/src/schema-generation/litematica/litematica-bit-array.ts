/**
 * This is a reimplementation of the LitematicaBitArray which accounts for the fact that Java 64bit longs
 * cannot be used in JavaScript. The block coordinates are instead bit-packed into a tuple representation
 * of a Long
 *
 * For the original representation, see:
 * https://github.com/maruohon/litematica/blob/master/src/main/java/fi/dy/masa/litematica/schematic/container/LitematicaBitArray.java
 */

import * as long from './long';
import * as _ from 'lodash';

export const getNeededBits = (size: number) => {
  return Math.max(Math.ceil(Math.log2(size)), 2);
};

export type BitArray = {
  array: long.Long[];
  num_bits: number;
  mask: number;
  volume: number;
};

/**
 * Initialize a new BitArray data structure from a given map volume and
 * block palette length
 *
 * This will also initialize some internal values used for bit-packing
 */
export const createBitArray = (volume: number, palette_length: number): BitArray => {
  const num_bits = getNeededBits(palette_length);

  const array: long.Long[] = _.range(Math.ceil(volume * num_bits)).map(() => [0, 0]);
  const mask = (1 << num_bits) - 1;
  return {
    volume,
    mask,
    array,
    num_bits
  };
};

/**
 * Set the block palette index used for a specified `index`. This will bit-pack the
 * value into the next available long
 */
export const set = (bit_array: BitArray, index: number, value: number) => {
  const startOffset = index * bit_array.num_bits;
  const startArrIndex = startOffset >> 6;
  const endArrIndex = ((index + 1) * bit_array.num_bits - 1) >> 6;
  const startBitOffset = startOffset & 0x3f;

  bit_array.array[startArrIndex] = long.or(
    long.and(bit_array.array[startArrIndex], long.not(long.shiftLeft([0, bit_array.mask], startBitOffset))),
    long.shiftLeft([0, value & bit_array.mask], startBitOffset)
  );

  if (startArrIndex !== endArrIndex) {
    const endOffset = 64 - startBitOffset;
    const j1 = bit_array.num_bits - endOffset;

    bit_array.array[endArrIndex] = long.or(
      long.shiftRight(long.shiftLeft(bit_array.array[endArrIndex], j1), j1),
      long.shiftRight([0, value & bit_array.mask], endOffset)
    );
  }

  return bit_array;
};

/**
 * Get the block material index for a specified coordinate.
 *
 * Unimplemented
 */
export const get = (bit_array: BitArray, index: number) => {
  // const startOffset = index * this.bitsPerEntry;
  // const startArrIndex = startOffset >> 6;
  // const endArrIndex = ((index + 1) * (this.bitsPerEntry - 1)) >> 6;
  // const startBitOffset = startOffset & 0x3f;
  //
  // if (startArrIndex === endArrIndex) {
  //   return (this.arr[startArrIndex] >>> startBitOffset) & this.maxEntryValue;
  // } else {
  //   const endOffset = 64 - startBitOffset;
  //   return ((this.arr[startArrIndex] >>> startBitOffset) | (this.arr[endArrIndex] << endOffset)) & this.maxEntryValue;
  // }
};

/**
 * Extract only the necessary longs from the internal storage array. This will effectively drop all trailing longs
 * that are '0' or has had no operations performed against it
 *
 * [[0, 1234], [0, 4321], [0, 0], [0, 0], [0, 0] ...]
 * ->
 * [[0, 1234], [0, 0]]
 */
export const drain = (bit_array: BitArray) => {
  const last_relevant_index = bit_array.array.reduce((last, long, i) => {
    const [low, high] = long;
    if (low === 0 && high === 0) {
      if (last !== -1) {
        return last;
      } else {
        return i;
      }
    }
    return -1;
  }, -1);

  if (last_relevant_index === -1) {
    return bit_array.array;
  }

  return bit_array.array.slice(0, last_relevant_index + 1);
};
