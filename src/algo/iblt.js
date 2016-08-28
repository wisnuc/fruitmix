import XXH from 'xxhashjs'
import xxhash from 'xxhash'

var UINT32 = require('cuint').UINT32

// in nodejs Buffer is also an instance of Uint8array
export const uuidToUint8Array = (uuid) => {
  return new Buffer(uuid.replace(/-/g, ''), 'hex')
}

// d for destructive, src is XORed into dst
export const XORD = (dst, src) => {

/**
  if (!(dst instanceof Uint8Array) || 
      !(src instanceof Uint8Array) ||
      (dst.length !== src.length) ||
      (dst.length === 0))
    throw new Error('XORD requires two Unint8Arrays with the same, non-zero length')
**/
  for (let i = 0; i < dst.length; i++) 
    dst[i] = dst[i] ^ src[i]

  return dst
}

// This class construct an iblt using xxhash
export class XXIBLT {

  // exponent: the number of cells will be 2 ^ exponent
  // keySize: key buffer size (16 for uuid, 32 for sha256)
  // k: how many hash functions as in bloom filter
  // seed: a UINT32 object in cuint package
  // the checksum size is fixed 32 bits / 4 bytes (little endian)
  constructor(exponent, keySize, k, seed) {

    this.exponent = exponent
    this.size = Math.pow(2, exponent)

    this.keySize = keySize
    this.k = k
    this.seed = seed

    this.zeroKey = new Buffer(keySize).fill(0)
    this.zeroHashkey = new Buffer(4).fill(0)

    this.zero = new Buffer(keySize + 4)
    this.zero.fill()

    // scratchpad
    this.CHECKSUM = new Buffer(4)

    this.cnt = new Array(this.size)
    this.cnt.fill(0)
    this.buf = new Buffer((keySize + 4) * this.size)
    this.buf.fill(0)
  }

  // must be distinct
  locations(key) {

    let indexes = []
    let seed = this.seed
    while(indexes.length < this.k) {

      seed = xxhash.hash(key, seed)
      let idx = seed % this.size
      if (!indexes.find(i => i === idx)) indexes.push(idx)
    }
    return indexes
  }

  print() {
    for (let i = 0; i < this.size; i++) {
      if (this.zero.compare(this.buf, i * (this.keySize + 4), (i + 1) * (this.keySize + 4)) === 0 &&
          this.cnt[i] === 0)
        continue

      let hex = this.buf.toString('hex', i * (this.keySize + 4), i * (this.keySize + 4) + this.keySize) 
      let checksum = this.buf.toString('hex', i * (this.keySize + 4) + this.keySize, (i + 1) * (this.keySize + 4))
      console.log(`${i} : ${hex} : ${checksum} : ${this.cnt[i]}`)
      // console.log(this.buf.toString('hex', i * (this.keySize + 4), i * (this.keySize + 4) + this.keySize))
    }      
  }

  INSERT(key) {

    this.locations(key).forEach(index => {

      let keySize = this.keySize

      this.cnt[index]++
      let offset = index * (keySize + 4)

      for (let i = 0; i < keySize; i++) 
        this.buf[offset + i] = this.buf[offset + i] ^ key[i]

      xxhash.hash(key, this.seed, this.CHECKSUM)
      this.buf[offset + keySize + 0] = this.buf[offset + keySize + 0] ^ this.CHECKSUM[0]
      this.buf[offset + keySize + 1] = this.buf[offset + keySize + 1] ^ this.CHECKSUM[1]
      this.buf[offset + keySize + 2] = this.buf[offset + keySize + 2] ^ this.CHECKSUM[2]
      this.buf[offset + keySize + 3] = this.buf[offset + keySize + 3] ^ this.CHECKSUM[3]
    })
  }

  DELETE(key) {

    this.locations(key).forEach(index => {
    
      let keySize = this.keySize

      this.cnt[index]--
      let offset = index * (keySize + 4)

      for (let i = 0; i < keySize; i++) 
        this.buf[offset + i] = this.buf[offset + i] ^ key[i]

      xxhash.hash(key, this.seed, this.CHECKSUM)
      this.buf[offset + keySize + 0] = this.buf[offset + keySize + 0] ^ this.CHECKSUM[0]
      this.buf[offset + keySize + 1] = this.buf[offset + keySize + 1] ^ this.CHECKSUM[1]
      this.buf[offset + keySize + 2] = this.buf[offset + keySize + 2] ^ this.CHECKSUM[2]
      this.buf[offset + keySize + 3] = this.buf[offset + keySize + 3] ^ this.CHECKSUM[3]
    })
  }

  ENCODE(keys) {
    keys.forEach(key => this.INSERT(key))
  }

  SUBTRACT(iblt) {

    let keySize = this.keySize

    for (let i = 0; i < this.size; i++) {

      this.count[i] -= iblt.count[i]

      let offset = i * (keySize + 4)
      
      for (let j = 0; j < keySize; j++)
        this.buf[offset + j] = this.buf[offset + j] ^ iblt.buf[offset + j]

      this.buf[offset + keySize + 0] = this.buf[offset + keySize + 0] ^ iblt.buf[offset + keySize + 0]
      this.buf[offset + keySize + 1] = this.buf[offset + keySize + 1] ^ iblt.buf[offset + keySize + 1]
      this.buf[offset + keySize + 2] = this.buf[offset + keySize + 2] ^ iblt.buf[offset + keySize + 2]
      this.buf[offset + keySize + 3] = this.buf[offset + keySize + 3] ^ iblt.buf[offset + keySize + 3]
    }
  }

  DECODE() {
  }
}

