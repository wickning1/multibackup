const path = require('path')
const moment = require('dayjs')
const Ssh = require('ssh2-promise')
const util = require('./util')
const File = require('./file')
const Output = require('./output')

class TargetDisk {
  constructor (config, sshinfo, server) {
    this.server = server
    if (config.localAddress) sshinfo.localAddress = config.localAddress
    this.ssh = new Ssh(sshinfo)
    this.sftp = this.ssh.sftp()
    this.basepath = config.path
    this.latestpath = path.resolve(this.basepath, 'latest')
    this.filestoadd = []
    this.freespace = 0
    this.totalspace = 0
    this.files = {}
  }

  async connect () {
    await this.ssh.connect()
  }

  async gather () {
    this.files = {}
    await this.gatherdir(this.latestpath, this.files)
  }

  async gatherdir (directorypath, files) {
    const self = this
    const site = self.server.site
    const dir = await this.sftp.readdir(directorypath)
    for (const item of dir) {
      const itempath = path.resolve(directorypath, item.filename)
      const interiorpath = path.relative(self.latestpath, itempath)
      const stat = item.attrs
      if (stat.isFile()) {
        site.updategather(1)
        files[interiorpath] = new File(self, interiorpath, itempath, stat.mtime, stat.size)
      } else if (stat.isDirectory()) {
        await self.gatherdir(itempath, files)
      }
    }
    return files
  }

  async snapshot () {
    if (await util.sftp_exists(this.sftp, this.latestpath)) {
      // bail out if there's already a snapshot in the last 24 hours
      const dir = await this.sftp.readdir(this.basepath)
      const sorted = dir.filter(item => item.attrs.isDirectory() && /^\d+$/.test(item.filename))
        .sort((a, b) => b.filename.localeCompare(a.filename))
      if (sorted.length > 0) {
        const created = moment(sorted[0].filename, 'YYYYMMDDhhmmss')
        if (moment().diff(created, 'day') < 0.99) return
      }
      // if we made it this far, make the snapshot
      await this.ssh.exec('cp -al "' + this.latestpath + '" "' + this.basepath + '/' + moment().format('YYYYMMDDhhmmss') + '"')
    } else {
      await this.sftp.mkdir(this.latestpath)
    }
  }

  async setfreespace () {
    const out = await this.ssh.exec('df -B1 --output=avail,size ' + this.basepath)
    const dataline = out.split(/\r?\n/)[1]
    const split = dataline.trim().split(/\s+/)
    this.freespace = split[0]
    this.totalspace = split[1]
  }

  async put (sourcefile) {
    const site = this.server.site
    const source = sourcefile.filepath
    const dest = path.resolve(this.latestpath, sourcefile.interiorpath)
    await this.ssh.exec('mkdir -p "' + path.dirname(dest) + '"')
    const tracker = Output.uploadTracker(sourcefile.interiorpath, sourcefile.filesize)
    let lasttransferred = 0
    await this.sftp.fastPut(source, dest, {
      concurrency: 16,
      step: function (transferred) {
        tracker.update(transferred)
        site.update(transferred - lasttransferred)
        lasttransferred = transferred
      }
    })
    tracker.close()
  }

  async delete (sourcefile) {
    const deletepath = path.resolve(this.latestpath, sourcefile.interiorpath)
    console.log('delete', this.server.host, deletepath)
    // await this.sftp.unlink(deletepath)
  }

  async allput () {
    for (const file of this.filestoadd) await this.put(file)
  }

  getLocalFile (file) {
    return this.files[file.interiorpath]
  }

  hasFile (file) {
    return typeof this.getLocalFile(file) !== 'undefined'
  }

  hasValidFile (file) {
    const localfile = this.getLocalFile(file)
    if (!localfile) return false
    return localfile.isGoodCopyOf(file)
  }

  async hasMatchingFile (file, checksum) {
    const line = this.ssh.exec('sha1sum "' + file.filepath + '"')
    const localsum = line.trim().split(/\s+/)[0]
    return checksum === localsum
  }

  queuePut (file) {
    this.filestoadd.push(file)
    this.freespace -= file.filesize
  }

  getAllFiles () {
    return Object.values(this.files)
  }

  free () {
    return this.freespace / this.totalspace
  }
}

module.exports = TargetDisk
