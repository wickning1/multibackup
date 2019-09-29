const os = require('os')
const path = require('path')
const nodemailer = require('nodemailer')
const sprintf = require('sprintf-js').sprintf
const suffixes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
const timelabels = ['d', 'h', 'm', 's']
const divisors = [60, 60, 24]

let transporter
module.exports = {
  sftp_exists: async function (sftp, filepath) {
    try {
      const stat = await sftp.stat(filepath)
      return stat.isFile() || stat.isDirectory()
    } catch (e) {
      return false
    }
  },
  normalizedir: function (dir) {
    return dir.replace(new RegExp(`${path.sep}$`), '')
  },
  bytesToHuman: function (bytes) {
    if (!bytes) return '  0  '
    const scale = Math.floor(Math.log(bytes) / Math.log(1024))
    const suffix = suffixes[scale]
    const units = Math.pow(1024, scale)
    const bytesinunits = bytes / units
    const precision = 3 - Math.floor(Math.log10(bytesinunits))
    return sprintf('%1.' + precision + 'f%s', bytesinunits, suffix)
  },
  secondsToHuman: function (seconds) {
    let value = Math.round(seconds)
    if (value <= 0) return '0s'
    const timevalues = []
    for (const divisor of divisors) {
      timevalues.push(value % divisor)
      value = Math.floor(value / divisor)
    }
    timevalues.push(value)
    timevalues.reverse()
    let count = 0
    let ret = ''
    for (let i = 0; i < timevalues.length && count < 2; i++) {
      if (timevalues[i]) {
        ret += timevalues[i] + timelabels[i]
        count++
      }
    }
    return ret
  },
  mail: async function (config, subject, body) {
    if (!config.nodemailer) return
    if (!config.nodemailer.defaults) config.nodemailer.defaults = {}
    if (!transporter) transporter = nodemailer.createTransport(config.nodemailer.transport, config.nodemailer.defaults)
    const msg = { subject, html: body }
    if (!config.nodemailer.defaults.from) msg.from = `backups@${os.hostname()}`
    return transporter.sendMail(msg)
  }
}
