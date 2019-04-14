const path = require('path')
const SourceDisk = require('./sourcedisk')
const Source = require('./source')
const Output = require('./output')
const util = require('./util')

class MultiSource extends Source {
  constructor (config) {
    super()
    this.gathered = 0
    this.disks = []
    for (const directorypath of config.sources) {
      this.disks.push(new SourceDisk(directorypath, this))
    }
    // as a minor optimization, let's avoid scanning directories that cannot have
    // included files in them
    // the include/exclude rules require a specificity evaluation which is much too
    // complex for this phase, but we can definitely do a first-pass evaluation based
    // only on includes
    this.includes = { couldmatch: {}, doesmatch: {} }
    for (const site of config.sites) {
      for (const include of site.includes) {
        const dir = util.normalizedir(include)
        this.includes.doesmatch[dir] = true
        const dirs = dir.split(path.sep)
        for (let i = 0; i < dirs.length - 1; i++) {
          const subpath = dirs.slice(0, i + 1).join(path.sep)
          this.includes.couldmatch[subpath] = true
        }
      }
    }
  }

  updategather (num) {
    this.gathered += num
    this.tracker.update('Discovering files in the source directories... ' + this.gathered + ' found so far.')
  }

  async gather () {
    this.tracker = Output.openTracker()
    await Promise.all(this.disks.map(disk => disk.gather(this.includes)))
    this.tracker.close()
    for (const disk of this.disks) {
      Object.assign(this.files, disk.files)
    }
  }
}

module.exports = MultiSource
