const SourceDisk = require('./sourcedisk')

class Source {
  constructor(config) {
    this.disks = []
    for (const directorypath of config) {
      this.disks.push(new SourceDisk(directorypath))
    }
  }

  async gather() {
    await Promise.all(this.disks.map(disk => disk.gather()))
  }

  getAllFiles() {
    const ret = []
    for (const disk of this.disks) {
      for (const file of disk.getAllFiles()) {
        ret.push(file)
      }
    }
    return ret
  }
}

module.exports = Source
