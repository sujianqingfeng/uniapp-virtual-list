<template>
  <view class="wrapper-container">
    <scroll-view class="virtual-list" :scroll-y="true" @scroll="onScroll" :scroll-top="virtualListScrollTop"
      scroll-with-animation>
      <view class="list-container" :style="{ height: totalHeight + 'px' }">
        <slot :items="sortedVisibleItems" />
      </view>
    </scroll-view>

    <view class="slider-container">
      <Slider v-model="sliderPercentage" @input="onSliderChange" @dragging="onSliderDragging" />
    </view>
  </view>
</template>


<script>
import { throttle } from "./utils"
import Slider from "./Slider.vue"

export default {
	name: "VirtualList",
	components: {
		Slider,
	},
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
			visibleItems: [],
			startIndex: 0,
			endIndex: 0,
			itemHeights: {},
			lastScrollTop: 0,
			totalHeight: 0,
			virtualListScrollTop: 0,
			sliderPercentage: 0,
			isDragging: false,
			bufferSize: 5, // 新增：缓冲区大小
			calculatedHeights: {}, // New property to store calculated heights
		}
	},
	provide() {
		return {
			updateItemHeight: this.updateItemHeight,
			getItemHeightIsCalculated: this.getItemHeightIsCalculated,
		}
	},
	mounted() {
		this.queryContainerHeight()
		this.initializeItemHeights()
	},
	watch: {
		data: {
			handler() {
				this.initializeItemHeights()
				this.updateVisibleItems(this.lastScrollTop || 0)
			},
			deep: true,
			immediate: true,
		},
	},
	computed: {
		sortedVisibleItems() {
			return this.visibleItems.slice().sort((a, b) => a.top - b.top)
		},
	},
	methods: {
		queryContainerHeight() {
			const query = uni.createSelectorQuery().in(this)
			query
				.select(".virtual-list")
				.boundingClientRect((res) => {
					if (res) {
						this.containerHeight = res.height
						this.updateVisibleItems(0)
					}
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
		getItemHeightIsCalculated(id) {
			return this.calculatedHeights[id]
		},
		updateItemHeight(id, height) {
			this.calculatedHeights[id] = true
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
			const startIndex = Math.max(
				0,
				this.findStartIndex(scrollTop) - this.bufferSize,
			)
			const endIndex = Math.min(
				this.data.length - 1,
				this.findEndIndex(scrollTop + this.containerHeight, startIndex) +
					this.bufferSize,
			)

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

			// 新增：预加载项目
			this.preloadItems(startIndex, endIndex)
		},
		findStartIndex(scrollTop) {
			// 使用预设高度估算初始 low 值
			let low = Math.floor(scrollTop / this.estimatedHeight)
			let high = this.data.length - 1

			// 确保 low 不会超出范围
			low = Math.min(low, high)

			// 如果估算的位置已经超过了 scrollTop，向上查找正确的起始位置
			while (low > 0 && this.getItemTop(this.data[low].id) > scrollTop) {
				low--
			}

			// 二分查找
			while (low <= high) {
				const mid = Math.floor((low + high) / 2)
				const itemTop = this.getItemTop(this.data[mid].id)

				if (itemTop > scrollTop) {
					high = mid - 1
				} else if (
					itemTop +
						(this.itemHeights[this.data[mid].id] || this.estimatedHeight) <=
					scrollTop
				) {
					low = mid + 1
				} else {
					return mid
				}
			}

			return Math.max(0, low - 1)
		},
		findEndIndex(bottomEdge, startIndex) {
			let endIndex = startIndex
			let currentBottom =
				this.getItemTop(this.data[startIndex].id) +
				(this.itemHeights[this.data[startIndex].id] || this.estimatedHeight)

			while (endIndex < this.data.length - 1 && currentBottom < bottomEdge) {
				endIndex++
				currentBottom +=
					this.itemHeights[this.data[endIndex].id] || this.estimatedHeight
			}

			return Math.min(this.data.length - 1, endIndex)
		},

		throttleUpdateVisibleItems: throttle(
			function (scrollTop) {
				this.updateVisibleItems(scrollTop)
			},
			20,
			{ heading: true },
		),

		updateSliderPosition(scrollTop) {
			if (this.totalHeight <= this.containerHeight) {
				this.sliderPercentage = 0
			} else {
				const scrollPercentage =
					scrollTop / (this.totalHeight - this.containerHeight)
				this.sliderPercentage = Math.min(
					100,
					Math.max(0, scrollPercentage * 100),
				)
			}
		},

		onScroll(e) {
			const scrollTop = Math.max(0, e.detail.scrollTop)
			if (!this.isDragging) {
				this.throttleUpdateVisibleItems(scrollTop)
				this.updateSliderPosition(scrollTop)
			}
		},

		onSliderChange(newValue) {
			const scrollTop =
				(newValue / 100) * (this.totalHeight - this.containerHeight)
			this.virtualListScrollTop = scrollTop
			this.updateVisibleItems(scrollTop) // 移除节流，直接更新
		},
		onSliderDragging(isDragging) {
			this.isDragging = isDragging
		},

		// 新增方法：预加载项目
		preloadItems(startIndex, endIndex) {
			const preloadRange = 10 // 预加载的项目数量
			const preloadStartIndex = Math.max(0, startIndex - preloadRange)
			const preloadEndIndex = Math.min(
				this.data.length - 1,
				endIndex + preloadRange,
			)

			for (let i = preloadStartIndex; i <= preloadEndIndex; i++) {
				if (!this.visibleItems.some((item) => item.id === this.data[i].id)) {
					this.visibleItems.push({
						...this.data[i],
						top: this.getItemTop(this.data[i].id),
					})
				}
			}
		},
	},
}
</script>

<style lang="scss" scoped>
.wrapper-container {
  height: 100%;
  display: flex;


  .virtual-list {
    height: 100%;

    .list-container {
      position: relative;
    }
  }

  .slider-container {
    width: 20px;
    height: 100%;
    position: relative;
    background-color: #f0f0f0;
    border-radius: 10px;
  }
}
</style>
