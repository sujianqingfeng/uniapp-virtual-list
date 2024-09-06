<template>
  <scroll-view class="virtual-list" :scroll-y="true" @scroll="onScroll">
    <view class="list-container" :style="{height: totalHeight+'px'}">
      <slot :items="visibleItems"/>
    </view>
  </scroll-view>
</template>


<script>
import { throttle } from "./utils"

export default {
	name: "VirtualList",
	props: {
		data: {
			type: Array,
			default: () => [],
		},
		estimatedHeight: {
			type: Number,
			default: 100,
		},
	},
	data() {
		return {
			containerHeight: 0,
			itemHeight: 100,
			visibleItems: [],
			startIndex: 0,
			endIndex: 0,
			itemHeights: {},
			lastScrollTop: 0,
			totalHeight: 0,
		}
	},
	provide() {
		return {
			updateItemHeight: this.updateItemHeight,
		}
	},
	mounted() {
		this.queryContainerHeight()
		this.initializeItemHeights()
	},
	watch: {
		data: {
			handler(newVal, oldVal) {
				this.initializeItemHeights()
				this.updateVisibleItems(this.lastScrollTop || 0)
			},
			deep: true,
			immediate: true,
		},
	},
	methods: {
		queryContainerHeight() {
			const query = uni.createSelectorQuery().in(this)
			query
				.select(".virtual-list")
				.boundingClientRect((res) => {
					this.containerHeight = res.height
				})
				.exec()
		},
		initializeItemHeights() {
			this.itemHeights = this.data.reduce((acc, item) => {
				acc[item.id] = this.estimatedHeight
				return acc
			}, {})
			this.updateTotalHeight()
		},
		updateItemHeight(id, height) {
			this.itemHeights[id] = height
			this.updateTotalHeight()
			this.updateVisibleItems(this.lastScrollTop || 0)
		},
		updateTotalHeight() {
			this.totalHeight = Object.values(this.itemHeights).reduce(
				(sum, height) => sum + height,
				0,
			)

			this.$emit("totalHeightChange", this.totalHeight)
		},
		getItemTop(id) {
			let top = 0
			for (let i = 0; i < this.data.length; i++) {
				if (this.data[i].id === id) break
				top += this.itemHeights[this.data[i].id] || this.estimatedHeight
			}
			return top
		},
		updateVisibleItems(scrollTop) {
			this.lastScrollTop = scrollTop
			let currentTop = 0
			let startIndex = 0
			let endIndex = this.data.length - 1 // 默认设置为最后一个元素的索引

			// Find start index
			for (let i = 0; i < this.data.length; i++) {
				if (currentTop > scrollTop) {
					startIndex = Math.max(0, i - 1)
					break
				}
				currentTop += this.itemHeights[this.data[i].id] || this.estimatedHeight
			}

			// Find end index
			currentTop = 0
			for (let i = 0; i < this.data.length; i++) {
				currentTop += this.itemHeights[this.data[i].id] || this.estimatedHeight
				if (currentTop > scrollTop + this.containerHeight) {
					endIndex = Math.min(this.data.length - 1, i + 1)
					break
				}
			}

			this.$emit("rangeChange", {
				startIndex,
				endIndex: endIndex + 1,
			})

			this.visibleItems = this.data
				.slice(startIndex, endIndex + 1)
				.map((item) => ({
					...item,
					top: this.getItemTop(item.id),
				}))
		},
		onScroll: throttle(
			function (e) {
				const { scrollTop } = e.detail
				this.updateVisibleItems(scrollTop)
			},
			20,
			{ heading: true },
		),
	},
}
</script>

<style lang="scss" scoped>
.virtual-list {
  height: 100%;

  .list-container{
    position: relative;
  }
}
</style>
