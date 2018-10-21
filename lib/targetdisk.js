const moment = require('moment')

class TargetDisk {
  constructor(config, ssh, sftp) {
    this.ssh = ssh
    this.sftp = sftp
    this.basepath = config.path
    this.latestpath = this.basepath + '/latest'
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
    const dir = await this.sftp.readdir(directorypath)
    await Promise.all(dir.map(async function (item) {
      const itempath = path.resolve(directorypath, item.filename)
      const stat = await this.sftp.stat(itempath)
      if (stat.isFile()) {
        files[itempath] = new File(this, itempath, stat.mtime, stat.size)
      } else if (stat.isDirectory()) {
        await this.gather_dir(itempath, files)
      }
    }))
    return files
  }

  async snapshot() {
    await this.ssh.exec('cp -al "' + this.latestpath + '" "' + this.basepath + moment().format('YYYYMMDDhhmmss') + '"')
  }

  async setfreespace() {
    const out = await this.ssh.exec('df --output=avail,size ' + this.basepath)
    const [headerline, dataline] = out.split(/\r?\n/)
    [this.freespace, this.totalspace] = dataline.trim().split(/\s+/)
  }

  async put(sourcefile, ssh) {
    const source = sourcefile.disk.basepath + sourcefile.filepath
    const dest = this.latestpath + sourcefile.filepath
    await ssh.sftp().fastPut(source, dest)
  }

  async delete(sourcefile, ssh) {
    await ssh.sftp().unlink(this.latestpath + sourcefile.filepath)
  }

  async allput() {
    for (const file of this.filestoadd) await this.put(file)
  }

  hasFile(file) {
    return this.files[file.filepath] ? true : false
  }

  hasRecentFile(file) {
    const localfile = this.files[file.filepath]
    if (!localfile) return false
    return localfile.lastmod >= file.lastmod
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

  free() {
    return (this.totalspace - this.freespace)/this.totalspace
  }
}

module.exports = TargetDisk
