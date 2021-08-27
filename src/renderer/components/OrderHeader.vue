<template>
  <div v-if="this.orderId > 0">
    <h1><span v-text="this.order.order_type === 'job' ? 'Job Order' : 'PO'"></span> Number: {{ this.order.order_header_id }}</h1>

    <h1>Item Number: {{ this.order.item_number }}</h1>

    <!-- <h3>Print Request Id: {{ this.order.id }}</h3> -->
  </div>

  <div id="no-order" v-else>No Job Order Loaded</div>
</template>

<script>
export default {
  props: {
    order: {
      type: Object,
      default: {}
    }
  },

  data () {
    return {}
  },

  computed: {
    orderId () {
      return this.order ? this.order.order_header_id : null
    }
  }
}
</script>

<style>
#no-order {
  color: red;
  font-size: 28px;
  font-weight: 700;
  margin-top: 20px;
}
</style>