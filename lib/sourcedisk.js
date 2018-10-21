const fs = require('mz/fs')
const path = require('path')
const exec = require('child-process-promise').exec

class SourceDisk {
  constructor(config) {
    this.basepath = config.basepath
    this.files = {}
  }

  async gather() {
    this.files = {}
    await this.gather_dir(this.basepath, this.files)
  }

  async gather_dir(directorypath, files) {
    const dir = await fs.readdir(directorypath)
    await Promise.all(dir.map(async function (item) {
      const itempath = path.resolve(directorypath, item)
      const stat = await fs.stat(itempath)
      if (stat.isFile()) {
        files[itempath] = new File(this, itempath, stat.mtime, stat.size)
      } else if (stat.isDirectory()) {
        await this.gather_dir(itempath, files)
      }
    }))
    return files
  }

  async checksum(file) {
    const out = await exec('sha1sum "' + file.filepath + '"')
    return out
  }

  getFilesArray() {
    return Object.values(this.files)
  }
}
module.exports = SourceDisk
