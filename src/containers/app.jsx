import React from 'react'
import { ipcRenderer } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

import { Button } from '../components/button/button'
import './app.scss'

export class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      filePaths: [],
      destinationFolder: '',
      info: '',
      quantity: 1,
      suffix: '',
      order: 'consecutive',
      loading: false
    }

    this.handleSelectedFiles = this.handleSelectedFiles.bind(this)
    this.handleSelectedDestination = this.handleSelectedDestination.bind(this)
    this.handleInputChange = this.handleInputChange.bind(this)
  }

  componentDidMount () {
    ipcRenderer.on('selected-files', this.handleSelectedFiles)
    ipcRenderer.on('selected-directory', this.handleSelectedDestination)
  }

  componentWillUnmount () {
    ipcRenderer.removeListener('selected-files', this.handleSelectedFiles)
    ipcRenderer.removeListener('selected-directory', this.handleSelectedDestination)
  }

  handleSelectedFiles (event, files) {
    this.setState({filePaths: files, info: `Files selected: ${files}`})
  }

  handleSelectedDestination (event, directory) {
    this.setState({destinationFolder: directory, info: `Destination selected: ${directory}`})
  }

  cloneFiles () {
    const loadFiles = paths => {
      let files = []
      paths.forEach(filePath => {
        files.push({
          stream: fs.readFileSync(filePath),  // TODO: Check fail reading
          filename: path.basename(filePath)
        })
      })
      return files
    }
    const localCloneFiles = (files, destination) => {
      const {quantity, order, suffix} = this.state
      let times = 0
      if (order === 'consecutive') {
        while (++times <= quantity) {
          const prefix = `${'0'.repeat(quantity.toString().length - times.toString().length)}${times}`  // Fill with zeros
          const index = (times - 1) % files.length
          const finalSuffix = suffix ? (suffix + path.extname(files[index].filename)) : files[index].filename
          fs.writeFileSync(path.resolve(destination, `${prefix}${finalSuffix}`), files[index].stream)
        }
      } else {
        while (++times <= quantity) {
          const prefix = `${'0'.repeat(quantity.toString().length - times.toString().length)}${times}`  // Fill with zeros
          const index = Math.floor((times - 1) / Math.ceil(quantity / files.length))  // Review this, where should we take off extras? Now the last file is the one that misses
          const finalSuffix = suffix ? (suffix + path.extname(files[index].filename)) : files[index].filename
          fs.writeFileSync(path.resolve(destination, `${prefix}${finalSuffix}`), files[index].stream)
          // this.setState({info: `Processed files: ${times} out of ${quantity}`})
        }
      }
    }
    const {filePaths, destinationFolder, quantity} = this.state
    if (!filePaths || filePaths.length < 1) {
      return this.setState({info: 'Select the files you want to clone'})
    }
    if (!destinationFolder || !fs.existsSync(destinationFolder)) {
      return this.setState({info: 'Destination folder doesn\'t exist'})
    }
    if (!quantity || quantity < 1) {
      return this.setState({info: 'Quantity should be'})
    }
    this.setState({loading: true}, () => {
      setTimeout(() => {
        const files = loadFiles(filePaths)
        localCloneFiles(files, destinationFolder)
        this.setState({info: 'Files succesfully cloned!', loading: false})
      })
    })
  }

  handleInputChange (event) {
    this.setState({[event.target.name]: event.target.value})
  }

  render () {
    const { info, loading } = this.state

    if (loading) {
      return (<h2><i className='fa fa-spinner fa-pulse fa-fw' />Processing...</h2>)
    }
    return (
      <div id='content'>
        <h1>Welcome to File Cloner!</h1>
        <label htmlFor='quantity'>Quantity: </label>
        <input name='quantity' value={this.state.quantity} onChange={this.handleInputChange} type='number' min='1' max='9007199254740991' />
        <br />
        <label htmlFor='suffix'>Suffix: </label>
        <input name='suffix' value={this.state.suffix} onChange={this.handleInputChange} />
        <br />
        <span>Order:</span>
        <input type='radio' name='order' value='consecutive' onChange={this.handleInputChange} checked={this.state.order === 'consecutive'} /><span>Consecutive</span>
        <input type='radio' name='order' value='grouped' onChange={this.handleInputChange} checked={this.state.order === 'grouped'} /><span>Grouped</span>
        <br />
        <br />
        <Button color='info' type='button' faIcon='fa-files-o fa-3x' title='Select files' onClick={() => ipcRenderer.send('open-file-dialog')} />
        <i className='fa fa-arrow-right fa-2x' />
        <Button color='info' type='button' faIcon='fa-folder-open-o fa-3x' title='Select destination' onClick={() => ipcRenderer.send('open-directory-dialog')} />
        <i className='fa fa-arrow-right fa-2x' />
        <Button color='success' type='button' faIcon='fa-clone fa-3x' title='Clone files' onClick={() => this.cloneFiles()} />
        <br />
        <span id='info'>{info}</span>
      </div>
    )
  }
}
