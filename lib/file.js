class File {
  constructor(disk, filepath, lastmod, filesize) {
    this.disk = disk
    this.filepath = filepath
    this.lastmod = lastmod
    this.filesize = filesize
  }
}

module.exports = File
