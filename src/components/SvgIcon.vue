<template>
  <div v-if="icon" v-html="icon" />
</template>

<script>
export default {
  name: 'SvgIcon',
  props: {
    name: {
      type: String,
      required: true
    },
  },
  computed: {
    icon() {
      return this.$svgIcons[`./assets/icons/${this.name}.svg`];
    }
  }
};
</script>

<style scoped>
svg {
  fill: currentColor;
}
</style>