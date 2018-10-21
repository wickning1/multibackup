module.exports = {
  sftp_exists: async function(sftp, filepath) {
    try {
      const stat = await sftp.stat(filepath)
      return stat.isFile() || stat.isDirectory()
    } catch (e) {
      return false
    }
  }
}
