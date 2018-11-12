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
    this.source = source.getFilteredSource(config.includes, config.excludes)
    this.goal = 0
    this.current = 0
  }

  async connect() {
    await Promise.all(this.servers.map(server => server.connect()))
  }

  async snapshot() {
    await Promise.all(this.servers.map(server => server.snapshot()))
  }

  async gather() {
    await Promise.all(this.servers.map(server => server.gather()))
  }

  async delete() {
    await Promise.all(this.servers.map(server => server.delete(this.source)))
  }

  async put() {
    await Promise.all(this.servers.map(server => server.setfreespace()))
    for (const file of this.source.getAllFiles()) {
      this.queuePut(file)
    }
    this.tracker = Output.openTracker(this.name + ' Overall Progress', this.goal)
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
