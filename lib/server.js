const TargetDisk = require ('./targetdisk')
const ssh = require('ssh2-promise')
const os = require('os')

class Server {
  constructor(config) {
    if (config.keyfile.startsWith('~')) config.keyfile = config.keyfile.replace(/^~/, os.homedir())
    this.ssh = new ssh({
      host: config.host,
      username: config.user,
      identity: config.keyfile
    })
    this.sftp = new ssh.SFTP(this.ssh)
    this.disks = []
    for (const diskinfo of config.disks) {
      this.disks.push(new TargetDisk(diskinfo, this.ssh, this.sftp))
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

  async put() {
    for (const disk of this.disks) {
      await disk.allput()
    }
  }
}

module.exports = Server
