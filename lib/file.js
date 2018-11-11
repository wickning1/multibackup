class File {
  constructor(disk, interiorpath, filepath, lastmod, filesize) {
    this.disk = disk
    this.interiorpath = interiorpath
    this.filepath = filepath
    this.lastmod = lastmod
    this.filesize = filesize
  }
}

module.exports = File
