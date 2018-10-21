const fs = require('mz/fs')
const path = require('path')
const exec = require('child-process-promise').exec
const File = require('./file.js')

class SourceDisk {
  constructor(directorypath) {
    this.basepath = directorypath
    this.files = {}
  }

  async gather() {
    this.files = {}
    await this.gather_dir(this.basepath, this.files)
  }

  async gather_dir(directorypath, files) {
    const self = this
    const dir = await fs.readdir(directorypath)
    await Promise.all(dir.map(async function (item) {
      const itempath = path.resolve(directorypath, item)
      const stat = await fs.stat(itempath)
      if (stat.isFile()) {
        files[itempath] = new File(self, itempath, stat.mtime, stat.size)
      } else if (stat.isDirectory()) {
        await self.gather_dir(itempath, files)
      }
    }))
    return files
  }

  async checksum(file) {
    const out = await exec('sha1sum "' + file.filepath + '"')
    return out
  }

  getAllFiles() {
    return Object.values(this.files)
  }
}
module.exports = SourceDisk
