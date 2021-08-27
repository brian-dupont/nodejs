<template>
<div id="template-wrap">
  <div id='bottom'>
    <div id='wrapper'>
      <div id='left'>
        <h1 v-if='this.isSerialPortOpen'>{{ this.serialPort.path }} has been connected</h1>
        <h1 style='color:red;' v-else>No Scale Selected</h1>

        <serial-port-list v-if='! this.isSerialPortOpen' @serial-port-selected='setSerialPort'></serial-port-list>

        <button v-if='this.isSerialPortOpen' @click='closePort'>Disconnect Scale</button>

        <order-header :order="this.printRequest"></order-header>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import OrderHeader from './OrderHeader'
import SerialPortList from './SerialPortList'
import SerialPort from 'serialport'
import Readline from '@serialport/parser-readline'
import fs from 'fs'
import express from 'express'
const expressApp = express()
const expressPort = 3000

export default {
  components: { SerialPortList, OrderHeader },

  data () {
    return {
      serialPort: null,
      isSerialPortOpen: false,
      printRequest: null,
      lastWeight: null,
      weights: [],
      templateString: '',
      serverUrl: 'http://192.168.1.10'
    }
  },

  computed: {
    weightsReversed () {
      return this.weights.reverse()
    }
  },

  methods: {
    setSerialPort (path) {
      if (this.serialPort === null) {
        this.openPort(path, 'none')

        return
      }

      if (this.serialPort.path === path) {
        return
      }

      if (this.serialPort.isOpen) {
        this.serialPort.close()
      }

      this.openPort(path, 'none')
    },

    openPort (path, parity = 'none') {
      this.serialPort = new SerialPort(path, {
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: parity,
        rtscts: true
      })

      let parser = this.serialPort.pipe(new Readline({ delimiter: '\n' }))
      let self = this

      parser.on('data', this.handleIncomingSerialData)

      this.serialPort.on('error', function (error) {
        console.log('Error:' + error.message)
      })

      this.serialPort.on('open', () => {
        self.isSerialPortOpen = true

        self.serialPort.flush()

        console.log(`${path} serial port has been opened and flushed.`)
      })

      this.serialPort.on('close', () => {
        self.isSerialPortOpen = false

        self.serialPort = null

        console.log(`Serial port has been closed.`)
      })
    },

    closePort () {
      this.serialPort.close(err => {
        if (err) {
          console.log(err)
        }
      })

      this.serialPort = null

      this.isSerialPortOpen = false
    },

    handleIncomingSerialData (data) {
      console.log('Incoming raw data from scale: ' + data)

      if (!this.printRequest || !this.printRequest.id) {
        alert(
          'No print request found in DB.  Did you press the \'label from scale\' button in the ERP Dashboard?'
        )

        return false
      }

      try {
        let weight = data.replace(/[^\d.-]/g, '')

        console.log('Formatted weight from scale: ' + weight)

        if (weight === '' || isNaN(weight)) {
          this.handleInvalidData(data)

          return
        }

        this.handleValidData(weight)
      } catch (e) {
        console.log('Error handling the incoming serial data:')

        console.log(e.message)
      }
    },

    handleInvalidData (data) {
      alert(`Invalid Data: ${data}`)
    },

    handleValidData (weight) {
      this.lastWeight = weight

      this.weights.push(this.lastWeight)

      this.$http
        .get(
          `${this.serverUrl}/print_label_from_scale.php?print_request_id=${this.printRequest.id}&weight=${weight}`
        )
        .then(res => {
          this.buildTemplateString(res.data)

          this.writeTemplateStringToFile(this.templateString, res.data.next_job_item_number)
        })
        .catch(err => {
          console.log(err)

          alert('Error printing label from the scale.')
        })
    },

    buildTemplateString (templateData) {
      this.printRequest.next_job_item_number =
          templateData.next_job_item_number

      this.templateString =
        `FORMATNAME=T:\\APPS\\EASYLABL\\Development\\${this.printRequest.label_format}
        formatcount=${this.printRequest.label_count}
        where=(NUMBER= ${this.printRequest.item_number})
        SINGLEJOB=ON
        TESTPRINT=off
        NUMB="${this.printRequest.item_number}"
        LOTN="${this.printRequest.order_header_id}"
        WT=${templateData.weight}
        BAR=${templateData.barcode_without_next_job_item_number}
        ALLERGENS="${this.printRequest.allergens}"
        JULIAN="${templateData.julian}"
        INPUT="${this.printRequest.input}"
        lotnumber=${this.printRequest.lot_number}
        ;`

      return this.templateString
    },

    writeTemplateStringToFile (templateString, nextJobItemNumber) {
      fs.writeFile('C:\\LABEL\\serial.ser', nextJobItemNumber, err => {
        if (err) {
          console.log('Error writing to serial.ser file')

          return false
        }

        fs.writeFile('C:\\LABEL\\label.CMD', templateString, err => {
          if (err) {
            console.log(err)

            console.log('Error writing cmd file')

            return false
          }
        })

        console.log('Written to label.CMD file:')
        console.log(templateString)
      })
    },

    setPrintRequest (printRequest) {
      if (printRequest.order_type === 'po' && printRequest.print_type === 'batch') {
        this.handlePORequest(printRequest.id)

        return
      }

      if (printRequest.order_type === 'job' && printRequest.print_type === 'batch') {
        this.handleBatchRequest(printRequest.id)

        return
      }

      if (printRequest.print_type === 'reprint') {
        this.handleReprintRequest(printRequest.id)

        return
      }

      this.printRequest = printRequest
    },

    handleBatchRequest (printRequestId) {
      this.$http
        .get(
          `${this.serverUrl}/print_label_from_batch.php?print_request_id=${printRequestId}`
        )
        .then(res => {
          this.printRequest = res.data

          let templateString = this.buildTemplateString(this.printRequest)

          this.writeTemplateStringToFile(templateString, res.data.next_job_item_number)

          this.printRequest = null
        })
        .catch(err => console.log(err))
    },

    handleReprintRequest (printRequestId) {
      this.$http
        .get(
          `${this.serverUrl}/print_label_from_reprint.php?print_request_id=${printRequestId}`
        )
        .then(res => {
          this.printRequest = res.data

          let templateString = this.buildTemplateString(this.printRequest)

          this.writeTemplateStringToFile(templateString, res.data.next_job_item_number)
        })
        .catch(err => console.log(err))
    },

    handlePORequest (printRequestId) {
      this.$http
        .get(
          `${this.serverUrl}/print_label_from_po.php?print_request_id=${printRequestId}`
        )
        .then(res => {
          this.printRequest = res.data

          let templateString = this.buildTemplateString(this.printRequest)

          this.writeTemplateStringToFile(templateString, res.data.next_job_item_number)
        })
        .catch(err => console.log(err))
    }
  },

  mounted () {
    const remote = require('electron').remote
    let port, parity, serverUrl

    if (process.env.NODE_ENV === 'development') {
      port = remote.process.argv[3]
      parity = remote.process.argv[4]
      serverUrl = remote.process.argv[5]
    } else {
      port = remote.process.argv[1]
      parity = remote.process.argv[2]
      serverUrl = remote.process.argv[3]
    }

    if (parity === undefined) {
      parity = 'none'
    }

    if (serverUrl !== undefined) {
      this.serverUrl = 'http://' + serverUrl
    }

    console.log('ComPort: ' + port, 'Parity: ' + parity, 'Server Url: ' + this.serverUrl)

    if (port !== undefined) {
      this.openPort(port, parity)
    }
  },

  beforeCreate () {
    let bodyParser = require('body-parser')

    expressApp.use(bodyParser.json())
    expressApp.use(bodyParser.urlencoded({ extended: true }))

    expressApp.post('/setup-printing', (req, res) => {
      this.setPrintRequest(res.req.body)

      res.json({
        success: true
      })
    })

    expressApp.post('/clear-setup', (req, res) => {
      this.printRequest = null

      this.templateString = ''

      this.lastWeight = ''

      this.weights = []

      res.json({
        success: true
      })
    })

    expressApp.post('/manual-print', (req, res) => {
      this.setPrintRequest(res.req.body)

      this.handleIncomingSerialData(res.req.body.weight)

      res.json({
        success: true
      })
    })

    expressApp.listen(expressPort, () => console.log('Express server running...'))
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  margin: 0px;
}

#wrapper {
  display: flex;
  flex-direction: column;
  padding: 10px;
}

#left,
#right {
  width: 100%;
}

#right {
  display: flex;
  align-items: center;
  font-size: 100px;
  margin-top: 20px;
}

#bottom {
  background-color: whitesmoke;
  border-top: 4px solid gray;
  width: 100%;
  height: 250px;
  margin: 0 auto;
  flex-grow: 1;
}

#weight-list {
  width: 100%;
  font-size: 30px;
}

h1 {
  font-size: 28px;
}

#template-wrap {
  height:100%;
  width: 100%;
  display:flex;
  flex-direction:column;
  justify-content: start;
  background-color:darkgray;
  background-image: linear-gradient(to bottom, white, lightgreen);
}
</style>