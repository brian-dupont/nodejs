<template>
  <div id='erp' style='width:100%; min-height:600px; width: 100%; margin: 0 auto; position: relative;'>
    <div id='webview-wrap'>
      <nav>
        <ul>
          <li>
            <button @click='goBack()' type='button'>Go Back</button>
          </li>

          <li>
            <button @click='goHome()' type='button'>Go Home</button>
          </li>
        </ul>
      </nav>

      <webview style='width:100%;height:600px;' ref='erp' :src='`${this.serverUrl}`' allowpopups></webview>
    </div>

    <div id='spinner-wrap' class='spinner'>
      <loading-spinner></loading-spinner>
    </div>
  </div>
</template>

<script>
import LoadingSpinner from './Spinner'

onload = () => {
  let webview = document.querySelector('webview')
  let webviewWrap = document.getElementById('webview-wrap')
  let spinner = document.getElementById('spinner-wrap')

  let loadstart = () => {
    document.body.classList.add('busy-cursor')

    webviewWrap.classList.add('hidden')

    spinner.classList.remove('hidden')
  }

  let loadstop = () => {
    webviewWrap.classList.remove('hidden')

    spinner.classList.add('hidden')

    document.body.classList.remove('busy-cursor')
  }

  webview.addEventListener('did-start-loading', loadstart)
  webview.addEventListener('did-stop-loading', loadstop)
}

export default {
  components: { LoadingSpinner },

  props: {
    serverUrl: {
      type: String,
      required: true
    },

    visible: {
      type: Boolean,
      required: true
    }
  },

  data () {
    return {}
  },

  watch: {
    visible: function (val, oldVal) {
      if (val === true) {
        // show dashboard
        let erp = document.getElementById('erp')
        erp.classList.remove('hidden')

        let webview = document.querySelector('webview')
        let webviewWrap = document.getElementById('webview-wrap')
        let spinner = document.getElementById('spinner-wrap')

        let loadstart = () => {
          document.body.classList.add('busy-cursor')

          webviewWrap.classList.add('hidden')

          spinner.classList.remove('hidden')
        }

        let loadstop = () => {
          webviewWrap.classList.remove('hidden')

          spinner.classList.add('hidden')

          document.body.classList.remove('busy-cursor')
        }

        webview.addEventListener('did-start-loading', loadstart)
        webview.addEventListener('did-stop-loading', loadstop)
      } else {
        // hide dashboard
        let erp = document.getElementById('erp')
        erp.classList.add('hidden')

        let webview = document.querySelector('webview')
        let webviewWrap = document.getElementById('webview-wrap')
        let spinner = document.getElementById('spinner-wrap')

        let loadstart = () => {
          document.body.classList.add('busy-cursor')

          webviewWrap.classList.add('hidden')

          spinner.classList.remove('hidden')
        }

        let loadstop = () => {
          webviewWrap.classList.remove('hidden')

          spinner.classList.add('hidden')

          document.body.classList.remove('busy-cursor')
        }

        webview.addEventListener('did-start-loading', loadstart)
        webview.addEventListener('did-stop-loading', loadstop)
      }
    }
  },

  methods: {
    goHome () {
      this.$refs.erp.src = this.serverUrl
    },

    goBack () {
      this.$refs.erp.goBack()
    },

    hideDashboard () {
      document.getElementById('webview-wrap').classList.add('hidden')
    },

    showDashboard () {
      document.getElementById('webview-wrap').classList.remove('hidden')
    }
  }
}
</script>
<style>
  .spinner {
    top :46%;
    left: 46%;
    position: absolute;
  }

  .hidden {
    display: none;
    height: 0px;
  }

  body.busy-cursor {
    cursor: progress;
  }

  ul {
    display: flex;
    list-style-type: none;
    margin: 0;
    padding: 5px;
    background-color: lightgreen;
  }

  ul > li {
    margin-right: 15px;
  }

  button:hover {
    cursor: pointer;
  }
</style>