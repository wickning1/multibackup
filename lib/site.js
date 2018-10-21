const Server = require('./server')

class Site {
  constructor(config) {
    this.redundancy = config.redundancy
    this.servers = []
    for (const serverinfo of config.servers) {
      this.servers.push(new Server(serverinfo))
    }
    this.disks = []
    for (const server of this.servers) {
      for (const disk of server.disks) {
        this.disks.push(disk)
      }
    }
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

  async delete(source) {
    await Promise.all(this.disks.map(async function (disk) {
      await Promise.all(disk.files.map(async function (file) {
        if (!source.hasFile(file)) await disk.delete(file)
      }))
    }))
  }

  async put(source) {
    await Promise.all(this.servers.map(server => server.setfreespace()))
    for (const file of source.getAllFiles()) {
      this.queuePut(file)
    }
    await Promise.all(this.servers.map(server => server.put()))
  }

  queuePut(file) {
    let count = 0
    for (const disk of this.disks) {
      if (disk.hasRecentFile(file)) count++
    }
    if (count < this.config.redundancy) {
      this.sortDisks()
      for (let i = 0; i < this.disks.length && count < this.config.redundancy; i++) {
        if (!disk.hasRecentFile(file)) {
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
