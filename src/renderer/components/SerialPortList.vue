<template>
<div>
    <button v-if="! portsVisible" @click="showPorts()">Show Serial Ports</button>

    <button v-if="portsVisible" @click="hidePorts()">Hide Serial Ports</button>

    <ul v-if="portsVisible" style='background-color: whitesmoke;'>
        <li class="serialport" @click="selectPort(port.path)" v-for="(port, index) in this.serialPorts" :key="index">{{ port.path }}</li>
    </ul>
</div>
</template>

<script>
import SerialPort from 'serialport'

export default {
  data () {
    return {
      serialPorts: [],
      portsVisible: false
    }
  },

  methods: {
    showPorts () {
      this.portsVisible = true
    },

    hidePorts () {
      this.portsVisible = false
    },

    selectPort (path) {
      this.$emit('serial-port-selected', path)

      this.portsVisible = false
    }
  },

  mounted () {
    this.serialPorts = SerialPort.list()
      .then(ports => {
        this.serialPorts = ports
      })
      .catch(error => console.log(error.message))
  }
}
</script>

<style scoped>
.serialport:hover {
    cursor: pointer;
}

ul {
  display: block;
}

ul > li {
  margin-bottom: 5px;
}
</style>