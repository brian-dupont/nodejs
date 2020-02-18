<template>
  <div>
    <div id='bottom'>
      <div id='wrapper'>
        <div id='left'>
          <h1 v-if='this.isSerialPortOpen'>{{ this.serialPort.path }} has been opened</h1>
          <h1 style='color:red;' v-else>No Serial Port Selected</h1>

          <serial-port-list v-if='! this.serialPort' @serial-port-selected='setSerialPort'></serial-port-list>

          <button v-if='this.serialPort' @click='closePort'>Disconnect</button>

          <order-header :job-order="this.printRequest"></order-header>
        </div>

        <div id='right'>
          <h6 style='font-size:24px; margin:0; padding:0;'>Previous Weight:</h6>

          <div id='last-weight'>{{ this.lastWeight }}</div>
        </div>
      </div>

      <div id='weight-list'>
        <ul>
          <li v-for='(weight, index) in this.weightsReversed' :key='index' v-text='weight'></li>
        </ul>
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
      templateString: ''
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
        this.openPort(path)

        return
      }

      if (this.serialPort.path === path) {
        return
      }

      let self = this

      if (this.serialPort.isOpen) {
        this.serialPort.close(() => (self.isSerialPortOpen = false))
      }

      this.openPort(path)
    },

    openPort (path) {
      this.serialPort = new SerialPort(path, {
        baudRate: 9600
      })

      let parser = this.serialPort.pipe(new Readline({ delimiter: '\n' }))
      let self = this

      parser.on('data', this.handleIncomingSerialData)

      this.serialPort.on('error', function (error) {
        console.log(error.message)

        self.isSerialPortOpen = !!this.serialPort.isOpen
      })

      this.serialPort.on('open', () => {
        self.isSerialPortOpen = true

        console.log(`${path} serial port has been opened.`)
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
    },

    handleIncomingSerialData (data) {
      if (!this.printRequest.id) {
        alert(
          'No print request found in DB.  Did you press the \'label from scale\' button in the ERP Dashboard?'
        )

        return false
      }

      try {
        let weight = parseFloat(data)

        if (isNaN(weight)) {
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
          `http://192.168.1.12:8080/print_label_from_scale.php?print_request_id=${this.printRequest.id}&weight=${this.lastWeight}`
        )
        .then(res => {
          this.buildTemplateString(res.data)

          this.writeTemplateStringToFile(this.templateString)
        })
        .catch(err => console.log(err.message))
    },

    buildTemplateString (templateData) {
      this.printRequest.next_job_item_number =
          templateData.next_job_item_number

      this.templateString =
          `FORMATNAME=${this.printRequest.label_format}
          formatcount=${this.printRequest.lbl_count}
          where=(NUMBER= ${this.printRequest.item_number})
          SINGLEJOB=ON
          TESTPRINT=off
          NUMB='${templateData.next_job_item_number}'
          LOTN='${this.printRequest.lot_number}'
          WT=${templateData.weight}
          BAR=${templateData.barcode_without_next_job_item_number}
          ALLERGENS='${this.printRequest.allergens}'
          INPUT='${this.printRequest.input}'
          ;`

      return this.templateString
    },

    writeTemplateStringToFile (templateString, nextJobItemNumber) {
      fs.writeFile('serial.ser', nextJobItemNumber, err => {
        if (err) {
          console.log('Error writing to serial.ser file')

          return false
        }

        fs.writeFile('label.CMD', templateString, err => {
          if (err) {
            console.log('Error writing to label.cmd file')

            return false
          }
        })
      })
    },

    setPrintRequest (printRequest) {
      if (printRequest.type === 'batch') {
        this.handleBatchRequest(printRequest.id)

        return
      }

      this.printRequest = printRequest
    },

    handleBatchRequest (printRequestId) {
      this.$http
        .get(
          `http://192.168.1.12:8080/print_label_from_batch.php?print_request_id=${printRequestId}`
        )
        .then(res => {
          this.printRequest = res.data

          let templateString = this.buildTemplateString(this.printRequest, this.printRequest.next_job_item_number)

          this.writeTemplateStringToFile(templateString)
        })
        .catch(err => console.log(err))
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

    expressApp.listen(expressPort, () => console.log('Express server running...'))
  }
}
</script>

<style>
#wrapper {
  display: flex;
  justify-content: space-between;
}

#left,
#right {
  width: 50%;
  border: 1px solid black;
  padding: 10px;
}

#right {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  font-size: 100px;
}

#weight-list {
  width: 100%;
  font-size: 30px;
}

h1 {
  font-size: 28px;
}
</style>