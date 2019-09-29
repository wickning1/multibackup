const fsp = require('fs').promises
const path = require('path')
const exec = require('child-process-promise').exec
const File = require('./file.js')
const util = require('./util')

class SourceDisk {
  constructor (directorypath, multisource) {
    this.basepath = util.normalizedir(directorypath)
    this.multisource = multisource
    this.files = {}
  }

  async gather (includes) {
    this.files = {}
    // add the disk's base absolute path to each include for easy comparison
    this.includes = { couldmatch: { [this.basepath]: true }, doesmatch: {} }
    for (const key of Object.keys(includes.doesmatch)) {
      this.includes.doesmatch[path.resolve(this.basepath, key)] = true
    }
    for (const key of Object.keys(includes.couldmatch)) {
      this.includes.couldmatch[path.resolve(this.basepath, key)] = true
    }
    await this.gatherdir(this.basepath, this.files)
  }

  dircouldmatch (dirpath) {
    return this.includes.couldmatch[dirpath]
  }

  dirmatch (dirpath) {
    return this.includes.doesmatch[dirpath]
  }

  async gatherdir (directorypath, files, alreadyincluding) {
    if (!alreadyincluding) alreadyincluding = this.dirmatch(directorypath)
    if (alreadyincluding || this.dircouldmatch(directorypath)) {
      const self = this
      const dir = await fsp.readdir(directorypath)
      await Promise.all(dir.map(async item => {
        const itempath = path.resolve(directorypath, item)
        const interiorpath = path.relative(self.basepath, itempath)
        const stat = await fsp.stat(itempath)
        if (alreadyincluding && stat.isFile()) {
          self.multisource.updategather(1)
          const checksum = Math.random() < 0.001 ? await this.checksum(itempath) : undefined
          files[interiorpath] = new File(self, interiorpath, itempath.split(path.sep).join('/'), stat.mtime, stat.size, checksum)
        } else if (stat.isDirectory()) {
          await self.gatherdir(itempath, files, alreadyincluding)
        }
      }))
    }
    return files
  }

  async checksum (filepath) {
    const out = await exec('sha1sum "' + filepath + '"')
    return out.stdout.trim().split(/\s+/)[0]
  }

  getAllFiles () {
    return Object.values(this.files)
  }
}
module.exports = SourceDisk
