import path from 'path'
import fs from 'fs'

import { expect } from 'chai'

import rimraf from 'rimraf'
import mkdirp from 'mkdirp'

import { createDocumentStore } from 'src/lib/documentStore'

describe(path.basename(__filename), function() {

  describe('create document store', function() {

    let testpath = path.join(process.cwd(), 'tmptest')

    beforeEach(function(done) {
      rimraf(testpath, err => {
        if (err) return done(err)
        mkdirp(path.join(testpath, 'tmp'), err => {
          if (err) return done(err)
          done()
        })
      })
    })

    it('should create a document store if path valid and subfolder tmp exists', function(done) {
      createDocumentStore(testpath, (err, store) => {
        if (err) return done(err)
        expect(store.rootdir).to.equal(testpath)
        expect(store.tmpdir).to.equal(path.join(testpath, 'tmp'))
        done()
      })
    })
  })

  describe('store document', function() {

    let testpath = path.join(process.cwd(), 'tmptest')
    let obj001 = { x: 1, y: 2 }
    let obj001Hash = '689a8f1db95402580476e38c264278ce7b1e664320cfb4e9ae8d3a908cf09964' 
    let docstore

    beforeEach(function(done) {
      rimraf(testpath, err => {
        if (err) return done(err)
        mkdirp(path.join(testpath, 'tmp'), err => {
          if (err) return done(err)
          createDocumentStore(testpath, (err, store) => {
            if (err) return done(err)
            docstore = store
            done()
          })
        })
      })
    })

    it('should store obj001 and return correct hash', function(done) {
      docstore.store(obj001, (err, hash) => {
        if (err) return done(err)
        expect(hash).to.equal(obj001Hash)
        done()
      }) 
    })

    it('should store obj001 into a file with path conforming to design "xx/xxxx..."', function(done) {
      docstore.store(obj001, (err, hash) => {
        if (err) return done(err)
        fs.readFile(path.join(testpath, obj001Hash.slice(0, 2), obj001Hash.slice(2)), (err, data) => {
          if (err) return done(err)
          expect(JSON.parse(data)).to.deep.equal(obj001)
          done()
        })
      })
    })

    it('should kept tmp folder clean after store object', function(done) {
      docstore.store(obj001, (err, hash) => {
        if (err) return done(err)
        fs.readdir(path.join(testpath, 'tmp'), (err, entries) => {
          if (err) return done(err)
          expect(entries.length).to.equal(0)
          done()
        })
      })
    })
  })

  describe('retrieve document', function() {
    
    let testpath = path.join(process.cwd(), 'tmptest')
    let obj001 = { x: 1, y: 2 }
    let obj001Hash = '689a8f1db95402580476e38c264278ce7b1e664320cfb4e9ae8d3a908cf09964' 
    let docstore

    beforeEach(function(done) {
      rimraf(testpath, err => {
        if (err) return done(err)
        mkdirp(path.join(testpath, 'tmp'), err => {
          if (err) return done(err)
          createDocumentStore(testpath, (err, store) => {
            if (err) return done(err)
            docstore = store
            docstore.store(obj001, (err, hash) => {
              if (err) return done(err)
              done()
            })
          })
        })
      })
    })

    it('should retrieve back obj001 from digest', function(done) {
      docstore.retrieve(obj001Hash, (err, obj) => {
        if (err) return done(err)
        expect(obj).to.deep.equal(obj001)
        done()
      })
    })

    it('should return error (EINVAL) if digest not a string', function(done) {
      docstore.retrieve({}, (err, obj) => {
        expect(err).to.be.an('error')
        expect(err.code).to.equal('EINVAL')
        done()
      })
    })

    it('should return error (EINVAL) if digest not a sha256 string', function(done) {
      docstore.retrieve('9f68e43a', (err, obj) => {
        expect(err).to.be.an('error')
        expect(err.code).to.equal('EINVAL')
        done()
      })
    })
  })
})
