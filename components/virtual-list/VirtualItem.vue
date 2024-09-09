<template>
  <view class="virtual-item" :class="'virtual-item-' + id" :style="{ top: item.top + 'px' }">
    <template v-if="item">

      <slot />
    </template>
  </view>
</template>


<script>
export default {
	name: "VirtualItem",
	inject: ["updateItemHeight", "getItemHeightIsCalculated"],
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
	mounted() {
		if (!this.getItemHeightIsCalculated(this.id)) {
			this.$nextTick(this.queryVirtualItemHeight)
		}
	},
	methods: {
		queryVirtualItemHeight() {
			const query = uni.createSelectorQuery().in(this)
			query
				.select(`.virtual-item-${this.id}`)
				.boundingClientRect((rect) => {
					if (rect && this.updateItemHeight) {
						this.updateItemHeight(this.id, rect.height)
					}
				})
				.exec()
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
