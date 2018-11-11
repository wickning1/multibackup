module.exports = {
  sources: [
    '/mnt/storage'
  ],
  sites: [{
    includes: [
      '/video' /* /mnt/storage/video */
    ],
    redundancy: 2,
    servers: [{
      user: 'root',
      host: '192.168.0.48',
      keyfile: '~/.ssh/id_rsa',
      disks: [{
        path: '/mnt/backups'
      }]
    }]
  }]
}
