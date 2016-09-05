import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

import rimraf from 'rimraf'
import mkdirp from 'mkdirp'

import { writeFileToDisk } from './util'

class DocumentStore {

  // the factory must assure the tmp folder exists !
  constructor(dir) {
    this.rootdir = dir
    this.tmpdir = path.join(dir, 'tmp')
  }

  store(object, callback) {

    let text, hash, digest, dirpath, filepath, tmppath

    text = JSON.stringify(object)
    hash = crypto.createHash('sha256')
    hash.update(text)
    digest = hash.digest().toString('hex')

    // src is in tmp folder
    dirpath = path.join(this.rootdir, digest.slice(0, 2))
    filepath = path.join(dirpath, digest.slice(2))
    tmppath = path.join(this.tmpdir, digest)

    mkdirp(dirpath, err => { // create head dir
      if (err) return callback(err)
      writeFileToDisk(tmppath, text, err => { // stream to file
        if (err) return callback(err)
        fs.rename(tmppath, filepath, err => {
          if (err) return callback(err)
          callback(null, digest)          
        }) 
      }) 
    })
  }

  retrieve(digest, callback) {

    let filepath

    if (/[0-9a-f]{64}/.test(digest) === false) {
      let error = new Error('digest invalid')
      error.code = 'EINVAL'
      return process.nextTick(callback, error)
    }
   
    filepath = path.join(this.rootdir, digest.slice(0, 2), digest.slice(2))
    fs.readFile(filepath, (err, data) => {
      if (err) return callback(err)
      try {
        callback(null, JSON.parse(data.toString()))
      }
      catch (e) {
        callback(e)
      }
    }) 
  }
}

const createDocumentStore = (dir, callback) => {

  if (!path.isAbsolute(dir)) {
    return process.nextTick(() => callback(new Error('require absolute path')))
  }

  fs.stat(dir, (err, stats) => {

    if (err) return callback(err)
    if (!stats.isDirectory())
      return callback(new Error('path must be folder'))

    rimraf(path.join(dir, 'tmp'), err => {
      mkdirp(path.join(dir, 'tmp'), err => {
        callback(null, new DocumentStore(dir))
      })
    })
  })
}

export { createDocumentStore }
