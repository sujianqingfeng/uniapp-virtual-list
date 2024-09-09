<template>
  <view class="virtual-item" :class="'virtual-item-' + id" :style="{ top: item.top + 'px', height: item.height + 'px' }">
    <template v-if="item">
      <slot />
    </template>
  </view>
</template>

<script>
export default {
	name: "VirtualItem",
	props: {
		id: {
			type: [String, Number],
			default: "",
		},
		item: {
			type: Object,
			default: () => ({}),
		},
	},
}
</script>

<style lang="scss" scoped>
.virtual-item {
  width: 100%;
  // border: 1px solid #000;
  box-sizing: border-box;
  position: absolute;
}
</style>
