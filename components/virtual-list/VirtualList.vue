<template>
  <view class="wrapper-container">
    <scroll-view class="virtual-list" :scroll-y="true" @scroll="onScroll" :scroll-top="virtualListScrollTop"
      scroll-with-animation>
      <view class="list-container" :style="{ height: totalHeight + 'px', paddingTop: topPadding + 'px' }">
        <slot :items="visibleItems" />
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
			default: 95,
		},
	},
	data() {
		return {
			containerHeight: 0,
			visibleItems: [],
			startIndex: 0,
			endIndex: 0,
			itemHeights: {},
			totalHeight: 0,
			virtualListScrollTop: 0,
			sliderPercentage: 0,
			isDragging: false,
			bufferSize: 10, // 新增：缓冲区大小
			updateQueue: [],
			isUpdating: false,
			topPadding: 0,
		}
	},
	mounted() {
		// this.queryContainerHeight()
		// this.initializeItemHeights()
	},
	watch: {
		data: {
			handler(value) {
				console.log("🚀 ~ handler ~ value:", value)
				this.queryContainerHeight()
				this.initializeItemHeights()
				this.queueUpdate(0)
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
						// this.updateVisibleItems(0)
					}
				})
				.exec()
		},
		initializeItemHeights() {
			this.itemHeights = this.data.reduce((acc, item) => {
				acc[item.id] = item.height || this.estimatedHeight
				return acc
			}, {})
			this.updateTotalHeight()
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
			100,
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
				this.updateSliderPosition(scrollTop)
				this.queueUpdate(scrollTop)
			}
		},

		queueUpdate(scrollTop) {
			this.updateQueue.push(scrollTop)
			this.processUpdateQueue()
		},

		processUpdateQueue() {
			if (this.isUpdating || this.updateQueue.length === 0) {
				return
			}

			this.isUpdating = true
			// console.log("🚀 ~ processUpdateQueue ~ isUpdating:", true)
			const scrollTop = this.updateQueue[this.updateQueue.length - 1] // Get the latest scroll position
			this.updateQueue = [] // Clear the queue

			this.throttledUpdateVisibleItems(scrollTop, () => {
				setTimeout(() => {
					this.isUpdating = false
					// console.log("🚀 ~ processUpdateQueue ~ isUpdating:", false)
					if (this.updateQueue.length > 0) {
						this.processUpdateQueue() // Process any new updates that came in
					}
				}, 10)
			})
		},

		throttledUpdateVisibleItems: throttle(
			function (scrollTop, callback) {
				this.updateVisibleItems(scrollTop)
				if (callback) callback()
			},
			100,
			{ leading: true },
		),

		async updateVisibleItems(scrollTop) {
			// console.log("🚀 ~ updateVisibleItems ~ scrollTop:", scrollTop)

			const startIndex = Math.max(
				0,
				this.findStartIndex(scrollTop) - this.bufferSize,
			)
			const endIndex = Math.min(
				this.data.length - 1,
				this.findEndIndex(scrollTop + this.containerHeight, startIndex) +
					this.bufferSize,
			)

			this.topPadding = this.getItemTop(this.data[startIndex].id)

			const newVisibleItems = this.data
				.slice(startIndex, endIndex + 1)
				.map((item) => ({
					...item,
					top: this.getItemTop(item.id),
				}))

			// 简化的更新逻辑
			this.visibleItems = newVisibleItems.map((newItem) => {
				const existingItem = this.visibleItems.find(
					(item) => item.id === newItem.id,
				)
				if (existingItem && existingItem.height === newItem.height) {
					return existingItem // 如果 id 和高度都没变，保留现有项
				}
				return newItem // 否则使用新项
			})

			this.$emit("rangeChange", { startIndex, endIndex: endIndex + 1 })
		},

		onSliderChange(newValue) {
			console.log("🚀 ~ onSliderChange ~ newValue:", newValue)
			const scrollTop =
				(newValue / 100) * (this.totalHeight - this.containerHeight)
			this.virtualListScrollTop = scrollTop
			this.updateVisibleItems(scrollTop) // 移除节流，直接更新
		},
		onSliderDragging(isDragging) {
			this.isDragging = isDragging
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
    flex-grow: 1;

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
