const TargetDisk = require('./targetdisk')
const os = require('os')

class Server {
  constructor (config, site) {
    this.site = site
    this.host = config.host
    if (config.keyfile.startsWith('~')) config.keyfile = config.keyfile.replace(/^~/, os.homedir())
    const sshinfo = {
      host: config.host,
      username: config.user || 'root',
      identity: config.keyfile || os.homedir() + '/.ssh/id_rsa'
    }
    this.disks = []
    for (const diskinfo of config.disks) {
      this.disks.push(new TargetDisk(diskinfo, sshinfo, this))
    }
  }

  async connect () {
    await Promise.all(this.disks.map(disk => disk.connect()))
  }

  async gather () {
    await Promise.all(this.disks.map(disk => disk.gather()))
  }

  async snapshot () {
    await Promise.all(this.disks.map(disk => disk.snapshot()))
  }

  async setfreespace () {
    await Promise.all(this.disks.map(disk => disk.setfreespace()))
  }

  async delete (source) {
    await Promise.all(this.disks.map(async function (disk) {
      for (const file of disk.getAllFiles()) {
        if (!source.hasFile(file)) await disk.delete(file)
      }
    }))
  }

  async put () {
    await Promise.all(this.disks.map(disk => disk.allput()))
  }
}

module.exports = Server
