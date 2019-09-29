module.exports = {
  email: 'youraddress@domain.com',
  sources: [
    '/mnt/storage'
  ],
  sites: [{
    includes: [
      'video' /* /mnt/storage/video */
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
  }],
  nodemailer: {
    transport: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: 'user@gmail.com',
        clientId: 'xxxxxxxxxxx',
        clientSecret: 'xxxxxxxxxxx',
        refreshToken: 'xxxxxxxxxxxxxxxxxxxx'
      }
    },
    defaults: {
      to: 'user@gmail.com'
    }
  }
}
