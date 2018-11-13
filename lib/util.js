const sprintf = require('sprintf-js').sprintf
const suffixes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
const timelabels = ['d', 'h', 'm', 's']
const divisors = [60, 60, 24]

module.exports = {
  sftp_exists: async function(sftp, filepath) {
    try {
      const stat = await sftp.stat(filepath)
      return stat.isFile() || stat.isDirectory()
    } catch (e) {
      return false
    }
  },
  bytesToHuman: function (bytes) {
    if (!bytes) return 'OB'
    const scale = Math.floor(Math.log(bytes) / Math.log(1024))
    const suffix = suffixes[scale]
    const units = Math.pow(1024, scale)
    const bytesinunits = 1.0 * bytes / units
    return sprintf('%.3g%s', bytesinunits, suffix)
  },
  secondsToHuman: function (seconds) {
    let value = Math.round(seconds)
    if (value <= 0) return '0s'
    const timevalues = []
    for (divisor of divisors) {
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
  }
}
