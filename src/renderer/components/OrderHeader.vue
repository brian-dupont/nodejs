<template>
  <div v-if="this.orderId > 0">
    <h1>Job Order Number: {{ this.jobOrder.job_header_id }}</h1>

    <h1>Item Number: {{ this.jobOrder.item_number }}</h1>

    <h3>Print Request Id: {{ this.jobOrder.id }}</h3>
  </div>

  <div id="no-order" v-else>No Job Order Loaded</div>
</template>

<script>
export default {
  props: {
    jobOrder: {
      type: Object,
      default: {}
    }
  },

  data () {
    return {}
  },

  computed: {
    orderId () {
      return this.jobOrder ? this.jobOrder.job_header_id : null
    }
  }
}
</script>

<style>
#no-order {
  color: red;
  font-size: 28px;
}
</style>