const TargetDisk = require ('./targetdisk')
const ssh = require('ssh2-promise')
const os = require('os')

class Server {
  constructor(config, site) {
    this.site = site
    this.host = config.host
    if (config.keyfile.startsWith('~')) config.keyfile = config.keyfile.replace(/^~/, os.homedir())
    this.ssh = new ssh({
      host: config.host,
      username: config.user,
      identity: config.keyfile || os.homedir() + '/.ssh/id_rsa'
    })
    this.sftp = this.ssh.sftp()
    this.disks = []
    for (const diskinfo of config.disks) {
      this.disks.push(new TargetDisk(diskinfo, this.ssh, this.sftp, this))
    }
  }

  async connect() {
    await this.ssh.connect()
  }

  async gather() {
    await Promise.all(this.disks.map(disk => disk.gather()))
  }

  async snapshot() {
    await Promise.all(this.disks.map(disk => disk.snapshot()))
  }

  async setfreespace() {
    await Promise.all(this.disks.map(disk => disk.setfreespace()))
  }

  async delete(source) {
    await Promise.all(this.disks.map(async function (disk) {
      for (const file of disk.getAllFiles()) {
        if (!source.hasFile(file)) await disk.delete(file)
      }
    }))
  }

  async put() {
    for (const disk of this.disks) {
      await disk.allput()
    }
  }
}

module.exports = Server
