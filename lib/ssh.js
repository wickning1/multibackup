const spawn = require('child_process').spawn

class Ssh {
  constructor (config) {
    this.config = config
  }

  connect () {
    const cfg = this.config
    return new Promise((resolve, reject) => {
      const cmd = [
        '-tt', // teletype mode
        `${cfg.user}@${cfg.host}`,
        ...(cfg.localAddress ? ['-D', cfg.localAddress] : []),
        ...(cfg.keyfile ? ['-i', cfg.keyfile] : [])
      ]
      this.ssh = spawn('ssh', cmd)
      this.sftp = spawn('sftp', cmd)
      this.ssh.stdout.on('data', chunk => {
        this.send(chunk.toString('utf8'))
      })
    })
  }

  runSsh (cmd) {
    this.ssh.stdin.write(Buffer.from(cmd, 'utf8'))
  }

  runSftp (cmd) {
    this.sftp.stdin.write(Buffer.from(cmd, 'utf8'))
  }

  send (str) {
    if (!this.subscriber) return
    const subscriber = this.subscriber
    delete this.subscriber
    subscriber(str)
  }

  read () {
    return new Promise((resolve, reject) => {
      this.subscriber = str => resolve(str)
    })
  }

  async put (path, progress) {
    this.runSftp('put ' + path)
    while (true) {
      const output = await this.read()
      progress(output)
    }
  }
}

module.exports = Ssh
