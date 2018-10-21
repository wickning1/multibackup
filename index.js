const Site = require('./lib/site.js')
const Source = require('./lib/source.js')

const config = {
  sources: [
    '/mnt/storage'
  ],
  sites: [{
    redundancy: 2,
    servers: [{
      user: 'ubuntumedia',
      host: '192.168.0.48',
      keyfile: '~/.ssh/id_rsa',
      disks: [{
        path: '/media/storage/backups'
      }]
    }]
  }]
}
const source = new Source(config.sources)
const sites = config.sites.map(siteconfig => new Site(siteconfig))

async function main() {
  await source.gather()
  console.log(source.getAllFiles())
  await Promise.all(sites.map(async function (site) {
    await site.connect()
    await site.snapshot()
    await site.gather()
    await site.delete(source)
    await site.put(source)
  }))
  process.exit()
}

main().catch(function (e) {
  console.log(e)
})
