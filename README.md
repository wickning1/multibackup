# multibackup
Incremental rsync backup balanced among many different target volumes on many different servers

# Overview
Not yet in a working state.

This is intended to be a simple backup solution meeting the following goals:
* Single RAID-ish source volume, multiple non-RAID target volumes
* Prevent bit rot in backed up files (assumes source volume is safe from bit rot as long as it is scrubbed frequently)
* Create incrementals to protect against accidental deletion/corruption
* Support multiple sites, multiple servers per site, multiple targets per server
* Configurable level of redundancy
* Ability to include/exclude files at each site
* Ability to configure use of outgoing network interfaces
* Minimal requirements on target systems
* Maximize performance and efficiency in general

I believe this is a better alternative than using a union filesystem to combine the target volumes, because that comes with significant CPU load and bottlenecks transfers on one system (the union filesystem host).

It does mean that recovery is a little more complicated, but I assume the backups will rarely be needed. I hope to provide some better recovery tools in the future.

# Installation
git clone
cd multibackup
npm install

# Configuration
module.exports = {
  sources: [
    '/mnt/storage1',
    '/mnt/storage2'
  ],
  sites: [{
    // array of paths to include for this site
    // relative to the source directory (or directories)
    // source directories will be merged and then the includes will be evaluated
    includes: [
      'video' // translates to -> /mnt/storage1/video + /mnt/storage2/video
    ],
    // array of paths to exclude for this site
    // relative to the source directory (or directories)
    // evaluated after includes, only really makes sense to exclude a subdirectory
    // of an include
    excludes: [
      'video/tmp' // don't back up temporary videos
    ],
    // number of copies to make of each file at this site, default 1
    redundancy: 2,
    // server list
    servers: [{
      user: 'root', // optional
      host: '192.168.0.48', // required
      // public key authentication is required; if you omit this configuration
      // it will try to find the key at the below path
      keyfile: '~/.ssh/id_rsa',
      disks: [{
        path: '/mnt/backups'
      }]
    }]
  }]
}

# Usage
npm run backup

# Terminology
* Source: The canonical volume in need of backup. I assume that it is a RAID volume or similar, so that it can prevent bit rot. Ideally it would be hosted on a system with ECC RAM and multiple network interfaces. If there are multiple volumes in need of backup, multiple instances of this script should be configured.
* Site: A physical location hosting servers. I assume that each site has a complete backup of the source (modified by include/exclude). Files will not be balanced across sites.
* Server: A physical machine with at least one drive and network interface.
* Target: An individual volume on a server where we will copy file backups. Ideally each hard drive has a single volume with a modern filesystem that can be mounted on any commodity machine should the server die, but that is not required.
