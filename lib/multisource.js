const SourceDisk = require('./sourcedisk')
const Source = require('./source')

class MultiSource extends Source {
  constructor(config) {
    super()
    this.disks = []
    for (const directorypath of config) {
      this.disks.push(new SourceDisk(directorypath))
    }
  }

  async gather() {
    await Promise.all(this.disks.map(disk => disk.gather()))
    for (const disk of this.disks) {
      Object.assign(this.files,disk.files)
    }
  }
}

module.exports = Source
