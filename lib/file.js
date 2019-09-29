const moment = require('dayjs')
const relativeTime = require('dayjs/plugin/relativeTime')
moment.extend(relativeTime)

class File {
  constructor (disk, interiorpath, filepath, lastmod, filesize, checksum) {
    this.disk = disk
    this.interiorpath = interiorpath
    this.filepath = filepath
    this.lastmod = Number.isInteger(lastmod) ? moment.unix(lastmod) : moment(lastmod)
    this.filesize = filesize
    this.checksum = checksum
  }

  isGoodCopyOf (file) {
    if (this.checksum) return this.checksum === file.checksum
    if (this.filesize !== file.filesize) return false
    return this.lastmod.isSame(file.lastmod) || this.lastmod.isAfter(file.lastmod)
  }
}

module.exports = File
