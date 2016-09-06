import path from 'path'
import crypto from 'crypto'

import Promise from 'bluebird'
import { expect } from 'chai'
import { rimrafAsync, mkdirpAsync, fs } from 'src/util/async'

import { createDocumentStore } from 'src/lib/documentStore'
import { createMediaShareStore } from 'src/lib/mediaShareStore'

describe(path.basename(__filename), function() {

  const cwd = process.cwd()
  const docroot = path.join(cwd, 'tmptest', 'documents')
  const msroot = path.join(cwd, 'tmptest', 'mediashare')
  const tmpdir = path.join(cwd, 'tmptest', 'tmp')

  const createDocumentStoreAsync = Promise.promisify(createDocumentStore)

  let docstore
  const share001 = {
    uuid: 'f889ec47-6092-4a6d-9647-3d6ef5fe2cab',
    x: 1,
    y: 2
  }
  const share001Hash = '0515fce20cc8b5a8785d4a9d8e51dd14e9ca5e3bab09e1bc0bd5195235e259ca'

  const share002 = {
    uuid: 'e3721bbe-edda-4ccc-bc4d-2ccd90dd0834',
    m: 'hello',
    n: 'world'
  }

  beforeEach(function() {
    return (async () => {
      await rimrafAsync(path.join(cwd, 'tmptest'))
      await mkdirpAsync(docroot)
      await mkdirpAsync(msroot)
      await mkdirpAsync(tmpdir)
      docstore = await createDocumentStoreAsync(docroot)
    })()
  })

  it('should create a mediashare store (nonsense example)', function() {
    let mstore = createMediaShareStore(msroot, tmpdir, docstore)
    expect(mstore.rootdir).to.equal(msroot) 
    expect(mstore.tmpdir).to.equal(tmpdir)
    expect(mstore.docstore).to.equal(docstore)
  })

  it('should store share001 with correct ref file', function(done) {
    let mstore = createMediaShareStore(msroot, tmpdir, docstore)
    mstore.store(share001, err => {
      if (err) return done(err)
      let refpath = path.join(msroot, share001.uuid)
      fs.readFile(refpath, (err, data) => {
        if (err) return done(err)
        expect(data.toString()).to.equal(share001Hash)
        done()
      })
    })
  })

  it('should store share001 in docstore', function(done) {
    let mstore = createMediaShareStore(msroot, tmpdir, docstore)
    mstore.store(share001, err => {
      if (err) return done(err)
      docstore.retrieve(share001Hash, (err, object) => {
        if (err) return done(err)
        expect(object).to.deep.equal(share001)
        done()
      })
    })
  })

  it('should retrieve share001 back with uuid', function(done) {
    let mstore = createMediaShareStore(msroot, tmpdir, docstore)
    mstore.store(share001, err => {
      if (err) return done(err)
      mstore.retrieve(share001.uuid, (err, object) => {
        if (err) return done(err)
        expect(object).to.deep.equal(share001)
        done()
      })
    })
  })

  it('should retrieve share001 and share002 by retrieve all', function(done) {
    let mstore = createMediaShareStore(msroot, tmpdir, docstore) 
    mstore.store(share001, err => {
      if (err) return done(err)
      mstore.store(share002, err => {
        if (err) return done(err)
        mstore.retrieveAll((err, array) => {
          if (err) return done(err)
          expect(array.sort((a, b) => a.uuid.localeCompare(b.uuid))).to.deep
            .equal([share001, share002].sort((a, b) => a.uuid.localeCompare(b.uuid)))
          done()
        })
      })
    })
  })
})


