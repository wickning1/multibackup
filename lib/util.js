const sprintf = require('sprintf-js').sprintf
const suffixes = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
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
  }
}
