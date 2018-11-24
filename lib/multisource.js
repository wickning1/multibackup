const SourceDisk = require('./sourcedisk')
const Source = require('./source')
const Output = require('./output')

class MultiSource extends Source {
  constructor (config) {
    super()
    this.gathered = 0
    this.disks = []
    for (const directorypath of config) {
      this.disks.push(new SourceDisk(directorypath, this))
    }
  }

  updategather (num) {
    this.gathered += num
    this.tracker.update('Discovering files in the source directories... ' + this.gathered + ' found so far.')
  }

  async gather () {
    this.tracker = Output.openTracker()
    await Promise.all(this.disks.map(disk => disk.gather()))
    this.tracker.close()
    for (const disk of this.disks) {
      Object.assign(this.files, disk.files)
    }
  }
}

module.exports = MultiSource
