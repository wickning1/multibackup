const Server = require('./server')
const Output = require('./output')

let sitecount = 0
class Site {
  constructor(config, source) {
    sitecount++
    this.name = config.name || 'Site ' + sitecount
    this.redundancy = config.redundancy
    this.servers = []
    for (const serverinfo of config.servers) {
      this.servers.push(new Server(serverinfo, this))
    }
    this.disks = []
    for (const server of this.servers) {
      for (const disk of server.disks) {
        this.disks.push(disk)
      }
    }
    this.source = source
    this.includes = config.includes
    this.excludes = config.excludes
    this.goal = 0
    this.current = 0
    this.gathered = 0
  }

  async connect() {
    await Promise.all(this.servers.map(server => server.connect()))
  }

  async snapshot() {
    await Promise.all(this.servers.map(server => server.snapshot()))
  }

  async gather() {
    this.tracker = Output.openTracker()
    await Promise.all(this.servers.map(server => server.gather()))
    this.tracker.close()
  }

  update_gather (num) {
    this.gathered += num
    this.tracker.update('Discovering existing backup files... ' + this.gathered + ' found so far.')
  }

  filteredsource() {
    if (!this.filtsource) this.filtsource = this.source.getFilteredSource(this.includes, this.excludes)
    return this.filtsource
  }

  async delete() {
    await Promise.all(this.servers.map(server => server.delete(this.filteredsource())))
  }

  async put() {
    await Promise.all(this.servers.map(server => server.setfreespace()))
    for (const file of this.filteredsource().getAllFiles()) {
      this.queuePut(file)
    }
    this.tracker = Output.uploadTracker(this.name + ' Overall Progress', this.goal)
    await Promise.all(this.servers.map(server => server.put()))
    this.tracker.close()
  }

  update(transferred) {
    this.current += transferred
    this.tracker.update(this.current)
  }

  queuePut(file) {
    let count = 0
    for (const disk of this.disks) {
      if (disk.hasValidFile(file)) count++
    }
    if (count < this.redundancy) {
      this.sortDisks()
      for (let i = 0; i < this.disks.length && count < this.redundancy; i++) {
        const disk = this.disks[i]
        if (!disk.hasValidFile(file)) {
          this.goal += file.filesize
          disk.queuePut(file)
          count++
        }
      }
    }
  }

  async sortDisks() {
    this.disks.sort((a,b) => {
      return a.free() > b.free() ? 1 : b.free() > a.free() ? -1 : 0
    })
    return this.disks
  }
}

module.exports = Site
