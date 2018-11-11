const moment = require('dayjs')
const util = require('./util')
const path = require('path')
const File = require('./file')
const Output = require('./output')

class TargetDisk {
  constructor(config, ssh, sftp, server) {
    this.server = server
    this.ssh = ssh
    this.sftp = sftp
    this.basepath = config.path
    this.latestpath = path.resolve(this.basepath, 'latest')
    this.filestoadd = []
    this.freespace = 0
    this.totalspace = 0
    this.files = {}
  }

  async gather() {
    this.files = {}
    await this.gather_dir(this.latestpath, this.files)
  }

  async gather_dir(directorypath, files) {
    const self = this
    const dir = await this.sftp.readdir(directorypath)
    await Promise.all(dir.map(async function (item) {
      const itempath = path.resolve(directorypath, item.filename)
      const interiorpath = path.relative(self.latestpath, itempath)
      const stat = item.attrs
      if (stat.isFile()) {
        files[interiorpath] = new File(self, interiorpath, itempath, stat.mtime, stat.size)
      } else if (stat.isDirectory()) {
        await self.gather_dir(itempath, files)
      }
    }))
    return files
  }

  async snapshot() {
    if (await util.sftp_exists(this.sftp, this.latestpath)) {
      await this.ssh.exec('cp -al "' + this.latestpath + '" "' + this.basepath + '/' + moment().format('YYYYMMDDhhmmss') + '"')
    } else {
      await this.sftp.mkdir(this.latestpath)
    }
  }

  async setfreespace() {
    const out = await this.ssh.exec('df --output=avail,size ' + this.basepath)
    const dataline = out.split(/\r?\n/)[1]
    const split = dataline.trim().split(/\s+/)
    this.freespace = split[0]
    this.totalspace = split[1]
  }

  async put(sourcefile) {
    const source = sourcefile.filepath
    const dest = path.resolve(this.latestpath, sourcefile.interiorpath)
    console.log('put',source,this.server.host,dest)
    await this.ssh.exec('mkdir -p "' + path.dirname(dest) + '"')
    const tracker = Output.getTracker(sourcefile.interiorpath, sourcefile.filesize)
    await this.sftp.fastPut(source, dest, { step: function (transferred) {
      tracker.update(transferred)
    }})
  }

  async delete(sourcefile) {
    const deletepath = path.resolve(this.latestpath, sourcefile.interiorpath)
    console.log('delete', this.server.host, deletepath)
    // await this.sftp.unlink(deletepath)
  }

  async allput() {
    for (const file of this.filestoadd) await this.put(file)
  }

  getLocalFile(file) {
    return this.files[file.interiorpath]
  }

  hasFile(file) {
    return this.getLocalFile(file) ? true : false
  }

  hasValidFile(file) {
    const localfile = this.getLocalFile(file)
    if (!localfile) return false
    return localfile.isGoodCopyOf(file)
  }

  async hasMatchingFile(file, checksum) {
    const line = this.ssh.exec('sha1sum "' + file.filepath + '"')
    const localsum = line.trim().split(/\s+/)[0]
    return checksum === localsum
  }

  queuePut(file) {
    this.filestoadd.push(file)
    this.freespace -= file.filesize
  }

  getAllFiles() {
    return Object.values(this.files)
  }

  free() {
    return (this.totalspace - this.freespace)/this.totalspace
  }
}

module.exports = TargetDisk
