import path from 'path'

import { expect } from 'chai'

import UUID from 'node-uuid'
import { UINT32 } from 'cuint'

import {
  uuidToUint8Array,
  XORD,
  encode,
  XXIBLT
} from 'src/algo/iblt'


let uuid0 = "fbc29e8b-b47c-4afd-927a-51322f369eb2"
let uuid1 = "5bbf8f3c-1dfb-49ee-ba90-4c8898d6b303"
let uuid2 = "71e9facd-0342-49e9-ae3a-8b3992efb9f3"
let uuid3 = "f101d691-767d-420c-ae1b-7f5688facbb8"
let uuid4 = "46a13cf5-b756-429f-b691-d347e241b063"
let uuid5 = "e89bf6c4-e9a1-49c2-98a6-e7872be24d51"
let uuid6 = "9523acc4-e3e1-4d1b-a222-f53330a95773"
let uuid7 = "7418f17f-c7b4-4321-8d09-5474499f7ff5"
let uuid8 = "0a54e78c-3093-498a-b728-466a49c1e091"
let uuid9 = "bf3b7147-0d47-4fcc-b008-a53a79fa2288"



let x = UUID.v4()
let y = uuidToUint8Array(x)
console.log(x)
console.log(y)

console.log(y instanceof Uint8Array)
console.log(y instanceof Buffer)
console.log(y.toString('hex'))
console.log(y.length)

describe('demo', function() {
  
  it('nodejs buffer is also an instance of Uint8Array', function() {
    let b = new Buffer(12)
    expect(b instanceof Uint8Array).to.be.true
  })

  it('a packed uuid string can be converted to 16-byte buffer', function() {
    let u = uuid0.replace(/-/g, '') 
    let b = new Buffer(u, 'hex')
    expect(b.length).to.equal(16)
  })

  it('buffer can be converted back to hex string via toString("hex")', function() {
    let u = uuid1.replace(/-/g, '')
    let b = new Buffer(u, 'hex')
    let r = b.toString('hex')
    expect(r).to.equal(u)
  })
})

describe('test XORD', function() {

  it('should return 92 for 5A ^ C8', function() {
    let dst = new Buffer('5a', 'hex')
    let src = new Buffer('c8', 'hex')

    XORD(dst, src)
    expect(dst.toString('hex')).to.equal('92')
  })
})

describe('test XORD perf', function() {

  let data = []
  before(function() {
    this.timeout(0)
    for (let i = 0; i < 1000000; i++)
      data.push(uuidToUint8Array(UUID.v4())) 
  })

/**
  it('calc 1 million XORD for uuids', function(){
    for (let i = 1; i < 1000000; i++)
      XORD(data[0], data[i])
  })
**/
})

describe('test encode', function() {

  let set1, set2
  before(function() {
    set1 = {
      exponent: 4,
      keySize: 4,
      valSize: 4,
      k: 1,
      seed: 12345,
      pairs: [
        {
          key: new Buffer('1e2a3390', 'hex'),
          value: new Buffer('25310223', 'hex')
        }
      ]
    }

    set2 = {
      exponent: 4,
      keySize: 4,
      valSize: 4,
      k: 1,
      seed: 12345,
      pairs: [
        {
          key: new Buffer('1e2a3390', 'hex'),
          val: new Buffer('25310223', 'hex'),
        }
      ]
    }
  })
  
  it('should GET back INSERTed value (a collision example)', function() {

    let b = new XXIBLT(4, 2, 2, 23345)    
    let key1 = new Buffer('1023', 'hex')
    let key2 = new Buffer('33aa', 'hex')
    b.INSERT(key1)
    b.INSERT(key2)
    b.print()
    b.DELETE(key1)
    b.DELETE(key2)
    b.print() 
  })  
})

describe('test INSERT perf', function() {

  let keys = [], B
  before(function() {

    this.timeout(0)

    for (let i = 0; i < 1000000; i++) {
      let keyuuid = UUID.v4().replace(/-/g, '')
      keys.push(new Buffer(keyuuid + keyuuid + keyuuid + keyuuid, 'hex')) 
    }

    B = new XXIBLT(14, 64, 4, 12345)
  }) 

  it('INSERT 1M uuid key value pair', function() {
    this.timeout(0)
    B.ENCODE(keys)
    console.log(B)
  })  
})
