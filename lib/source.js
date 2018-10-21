const SourceDisk = require('./sourcedisk')

class Source {
  constructor(config) {
    this.disks = []
    for (const diskconfig of config.disk) {
      this.disks.push(new SourceDisk(diskconfig))
    }
  }

  async gather() {
    await Promise.all(this.disks.map(disk => disk.gather()))
  }
}

module.exports = Source
