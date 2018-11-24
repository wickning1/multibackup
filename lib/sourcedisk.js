const fsp = require('fs').promises
const path = require('path')
const exec = require('child-process-promise').exec
const File = require('./file.js')

class SourceDisk {
  constructor (directorypath, multisource) {
    this.basepath = directorypath
    this.multisource = multisource
    this.files = {}
  }

  async gather () {
    this.files = {}
    await this.gatherdir(this.basepath, this.files)
  }

  async gatherdir (directorypath, files) {
    const self = this
    const dir = await fsp.readdir(directorypath)
    await Promise.all(dir.map(async function (item) {
      const itempath = path.resolve(directorypath, item)
      const interiorpath = path.relative(self.basepath, itempath)
      const stat = await fsp.stat(itempath)
      if (stat.isFile()) {
        self.multisource.updategather(1)
        files[interiorpath] = new File(self, interiorpath, itempath.split(path.sep).join('/'), stat.mtime, stat.size)
      } else if (stat.isDirectory()) {
        await self.gatherdir(itempath, files)
      }
    }))
    return files
  }

  async checksum (file) {
    const out = await exec('sha1sum "' + file.filepath + '"')
    return out
  }

  getAllFiles () {
    return Object.values(this.files)
  }
}
module.exports = SourceDisk
