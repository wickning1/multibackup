const Server = require('./server')
const Output = require('./output')

let sitecount = 0
class Site {
  constructor (config, source) {
    sitecount++
    this.name = config.name || 'Site ' + sitecount
    this.redundancy = config.redundancy || 1
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

  async connect () {
    await Promise.all(this.servers.map(server => server.connect()))
  }

  async snapshot () {
    await Promise.all(this.servers.map(server => server.snapshot()))
  }

  async gather () {
    this.tracker = Output.openTracker()
    await Promise.all(this.servers.map(server => server.gather()))
    this.tracker.close()
  }

  updategather (num) {
    this.gathered += num
    this.tracker.update('Discovering existing backup files... ' + this.gathered + ' found so far.')
  }

  filteredsource () {
    if (!this.filtsource) this.filtsource = this.source.getFilteredSource(this.includes, this.excludes)
    return this.filtsource
  }

  async delete () {
    await Promise.all(this.servers.map(server => server.delete(this.filteredsource())))
  }

  async put () {
    await Promise.all(this.servers.map(server => server.setfreespace()))
    for (const file of this.filteredsource().getAllFiles()) {
      this.queuePut(file)
    }
    this.tracker = Output.uploadTracker(this.name + ' Overall Progress', this.goal)
    await Promise.all(this.servers.map(server => server.put()))
    this.tracker.close()
  }

  update (transferred) {
    this.current += transferred
    this.tracker.update(this.current)
  }

  queuePut (file) {
    this.sortDisks()
    const [diskswithfile, diskswithoutfile, diskswithvalidfile, diskswithinvalidfile] = [[], [], [], []]
    for (const disk of this.disks) {
      if (disk.hasFile(file)) {
        diskswithfile.push(disk)
        if (disk.hasValidFile(file)) diskswithvalidfile.push(disk)
        else diskswithinvalidfile.push(disk)
      } else {
        diskswithoutfile.push(disk)
      }
    }

    // if we have too many files, let's get down to the correct count
    let count = diskswithfile.length
    let invalidcount = diskswithinvalidfile.length
    while (invalidcount > 0 && count > this.redundancy) {
      count--
      invalidcount--
      diskswithinvalidfile[invalidcount].queueDelete(file)
    }
    // all remaining invalid files need to become valid
    while (invalidcount > 0) {
      this.goal += file.filesize
      count++
      invalidcount--
      diskswithinvalidfile[invalidcount].queuePut(file)
      this.sortDisks()
    }
    // if we still have too many files, delete some valid files
    let validcount = diskswithvalidfile.length
    while (validcount > 0 && count > this.redundancy) {
      count--
      validcount--
      diskswithvalidfile[validcount].queueDelete(file)
    }
    // if we have too few files, add some
    for (let i = 0; i < diskswithoutfile.length && count < this.redundancy; i++) {
      this.goal += file.filesize
      count++
      diskswithoutfile[i].queuePut(file)
    }
  }

  async sortDisks () {
    this.disks.sort((a, b) => {
      return a.free() > b.free() ? -1 : b.free() > a.free() ? 1 : 0
    })
    return this.disks
  }
}

module.exports = Site
