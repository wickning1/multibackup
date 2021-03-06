const moment = require('dayjs')
const sprintf = require('sprintf-js').sprintf
const term = require('terminal-kit').terminal
const util = require('./util')

let trackers = []
class Output {
  static openTracker () {
    const tracker = new Tracker()
    trackers.push(tracker)
    return tracker
  }

  static uploadTracker (name, goal) {
    const tracker = new UploadTracker(name, goal)
    trackers.push(tracker)
    return tracker
  }

  static closeTracker (tracker) {
    trackers = trackers.filter(t => t !== tracker)
  }

  static init () {
    term.fullscreen(true)
  }

  static draw () {
    if (!trackers.some(t => t.updated())) return
    term.eraseDisplay()
    term.moveTo(1, 1)
    for (const tracker of trackers) {
      term(tracker.toString() + '\n')
    }
  }

  static close () {
    term.fullscreen(false)
  }
}

class Tracker {
  constructor () {
    this.current = ''
    this.version = 0
    this.lastprinted = 0
  }

  close () {
    Output.closeTracker(this)
  }

  update (value) {
    if (value !== this.current) {
      this.version++
      this.current = value
    }
  }

  updated () {
    return this.version > this.lastprinted
  }

  toString () {
    this.lastprinted = this.version
    return this.current
  }
}

class UploadTracker extends Tracker {
  constructor (name, goal) {
    super()
    this.name = name
    this.goal = goal
    this.goalHuman = util.bytesToHuman(goal)
    this.current = 0
    this.starttime = moment()
  }

  toString () {
    const now = moment()
    const elapsed = now.diff(this.starttime) / 1000.0
    const progress = (100.0 * this.current) / this.goal
    const remaining = this.current ? util.secondsToHuman((this.goal - this.current) * elapsed / this.current) : '?'
    const speed = this.current ? util.bytesToHuman(this.current / elapsed) : '    ?'
    return sprintf('%2i%% (%s / %s, %s/s) (%s remaining) %s', progress, util.bytesToHuman(this.current), this.goalHuman, speed, remaining, this.name)
  }
}

module.exports = Output
