const moment = require('dayjs')
class File {
  constructor(disk, interiorpath, filepath, lastmod, filesize) {
    this.disk = disk
    this.interiorpath = interiorpath
    this.filepath = filepath
    this.lastmod = Number.isInteger(lastmod) ? moment.unix(lastmod) : moment(lastmod)
    this.filesize = filesize
  }

  isGoodCopyOf(file) {
    if (this.filesize !== file.filesize) return false
    return this.lastmod.isSame(file.lastmod) || this.lastmod.isAfter(file.lastmod)
  }
}

module.exports = File
