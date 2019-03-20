import React from 'react'
import { ipcRenderer } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

import { Button } from '../components/button/button'
import './app.scss'
import logoSrc from '../assets/icons/icon.png'

export class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      filePaths: [],
      destinationFolder: '',
      info: {},
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
    ipcRenderer.removeListener(
      'selected-directory',
      this.handleSelectedDestination
    )
  }

  handleSelectedFiles (event, files) {
    this.setState({
      filePaths: files,
      info: { text: 'Files selected!', type: 'info' }
    })
  }

  handleSelectedDestination (event, directory) {
    this.setState({
      destinationFolder: directory,
      info: { text: 'Destination folder selected!', type: 'info' }
    })
  }

  cloneFiles () {
    const loadFiles = paths => {
      let files = []
      paths.forEach(filePath => {
        files.push({
          stream: fs.readFileSync(filePath), // TODO: Check fail reading
          filename: path.basename(filePath)
        })
      })
      return files
    }
    const localCloneFiles = (files, destination) => {
      const { quantity, order, suffix } = this.state
      let times = 0
      if (order === 'consecutive') {
        while (++times <= quantity) {
          const prefix = `${'0'.repeat(
            quantity.toString().length - times.toString().length
          )}${times}` // Fill with zeros
          const index = (times - 1) % files.length
          const finalSuffix = suffix
            ? suffix + path.extname(files[index].filename)
            : files[index].filename
          fs.writeFileSync(
            path.resolve(destination, `${prefix}${finalSuffix}`),
            files[index].stream
          )
        }
      } else {
        while (++times <= quantity) {
          const prefix = `${'0'.repeat(
            quantity.toString().length - times.toString().length
          )}${times}` // Fill with zeros
          const index = Math.floor(
            (times - 1) / Math.ceil(quantity / files.length)
          ) // Review this, where should we take off extras? Now the last file is the one that misses
          const finalSuffix = suffix
            ? suffix + path.extname(files[index].filename)
            : files[index].filename
          fs.writeFileSync(
            path.resolve(destination, `${prefix}${finalSuffix}`),
            files[index].stream
          )
        }
      }
    }
    const { filePaths, destinationFolder, quantity } = this.state
    if (!filePaths || filePaths.length < 1) {
      return this.setState({
        info: { text: 'Select the files you want to clone', type: 'warning' }
      })
    }
    if (!destinationFolder || !fs.existsSync(destinationFolder)) {
      return this.setState({
        info: { text: "Destination folder doesn't exist", type: 'warning' }
      })
    }
    if (!quantity || quantity < 1 || quantity > 10000) {
      return this.setState({
        info: {
          text: 'Quantity should be between 1 and 10000',
          type: 'warning'
        }
      })
    }
    if (
      window.confirm(
        'Files in the destination folder with the same name will be overwritten. Confirm?'
      )
    ) {
      this.setState({ loading: true }, () => {
        setTimeout(() => {
          const files = loadFiles(filePaths)
          localCloneFiles(files, destinationFolder)
          this.setState({
            info: { text: 'Files succesfully cloned!', type: 'success' },
            loading: false
          })
        })
      })
    }
  }

  handleInputChange (event) {
    if (event.target.name === 'quantity') {
      event.target.value = event.target.value.replace(/[^0-9]/gi, '')
      event.target.value = event.target.value > 10000 ? 10000 : event.target.value
    }
    this.setState({ [event.target.name]: event.target.value })
  }

  // TODO: Files orderer and maybe frecuency on each file
  render () {
    const { info, loading, filePaths, destinationFolder } = this.state

    if (loading) {
      return (
        <h2>
          <i className='fa fa-spinner fa-pulse fa-fw' />
          Processing...
        </h2>
      )
    }
    return (
      <div id='content'>
        <div id='header'>
          <h1>
            Welcome to File Cloner!
            <img id='logo' src={logoSrc} />
          </h1>
        </div>
        <h3>Options</h3>
        <hr />
        <label htmlFor='quantity'>
          Choose the number of resulting files:
          <input
            name='quantity'
            value={this.state.quantity}
            onChange={this.handleInputChange}
            type='text'
          />
        </label>
        <br />
        <label htmlFor='suffix'>
          Write down a suffix for your files (optional):
          <input
            name='suffix'
            type='text'
            maxLength='40'
            value={this.state.suffix}
            onChange={this.handleInputChange}
          />
          <small className='info'>
            Leave blank to use original filenames as suffix.
          </small>
          <br />
          <small className='info'>
            They will be numbered (XXXXsuffix.extension)
          </small>
        </label>
        <br />
        <label htmlFor='order'>
          Order:
          <div>
            Ordered
            <input
              type='radio'
              name='order'
              id='consecutive'
              value='consecutive'
              onChange={this.handleInputChange}
              checked={this.state.order === 'consecutive'}
            />
            Grouped
            <input
              type='radio'
              name='order'
              id='grouped'
              value='grouped'
              onChange={this.handleInputChange}
              checked={this.state.order === 'grouped'}
            />
          </div>
          <small className='info'>
            Ordered (1,2,3,1,2...) | Grouped (1,1,1,2,2...)
          </small>
        </label>
        <br />
        <h3>Process</h3>
        <hr />
        <Button
          color='info'
          type='button'
          faIcon='fa-files-o fa-3x'
          title='Select files'
          onClick={() => ipcRenderer.send('open-file-dialog')}
        />
        <i className='fa fa-arrow-right fa-2x' />
        <Button
          color='info'
          disabled={filePaths.length < 1}
          type='button'
          faIcon='fa-folder-open-o fa-3x'
          title='Select destination'
          onClick={() => ipcRenderer.send('open-directory-dialog')}
        />
        <i className='fa fa-arrow-right fa-2x' />
        <Button
          color='success'
          disabled={filePaths.length < 1 || !destinationFolder}
          type='button'
          faIcon='fa-clone fa-3x'
          title='Clone files'
          onClick={() => this.cloneFiles()}
        />
        <br />
        <div id='info' className={info.type}>
          {info.text}
        </div>
      </div>
    )
  }
}
