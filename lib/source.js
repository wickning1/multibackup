class Source {
  constructor() {
    this.files = {}
  }

  addFile(file) {
    this.files[file.filepath] = file
  }

  hasFile(file) {
    return this.files[file.filepath] ? true : false
  }

  getAllFiles() {
    return Object.values(this.files)
  }

  _check(file, includehash, excludehash) {
    const pieces = file.filepath.split('/')
    let included = true
    if (includehash.keys().length) {
      included = false
      for (let i = 1; i <= pieces.length; i++) {
        const subpath = pieces.slice(0,i).join('/')
        if (includehash[subpath]) included = true
      }
    }
    let excluded = false
    if (excludehash.keys().length) {
      for (let i = 1; i <= pieces.length; i++) {
        const subpath = pieces.slice(0,i).join('/')
        if (excludehash[subpath]) excluded = true
      }
    }
    return included && !excluded
  }

  getFilteredSource(includes, excludes) {
    const ret = new Source()
    const includehash = includes.reduce((prev, curr) => { prev[curr] = true; return prev }, {})
    const excludehash = excludes.reduce((prev, curr) => { prev[curr] = true; return prev }, {})
    for (const file of this.getAllFiles()) {
      if (this._check(file, includehash, excludehash)) ret.addFile(file)
    }
    return ret
  }
}
