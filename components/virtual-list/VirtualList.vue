<template>
  <view class="wrapper-container">
    <scroll-view class="virtual-list" :scroll-y="true" @scroll="onScroll" :scroll-top="virtualListScrollTop"  scroll-with-animation>
      <view class="list-container" :style="{ height: totalHeight + 'px' }">
        <slot :items="visibleItems" />
      </view>
    </scroll-view>

    <view class="slider-container">
      <view 
        class="slider"
        :style="{ top: sliderPosition + 'px' }"
        @touchstart="onSliderTouchStart"
        @touchmove="onSliderTouchMove"
        @touchend="onSliderTouchEnd"
      ></view>
    </view>
  </view>
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
			sliderPosition: 0,
			isDragging: false,
			virtualListScrollTop: 0,
		}
	},
	computed: {
		sliderHeight() {
			return (this.containerHeight / this.totalHeight) * this.containerHeight
		},
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
			const startIndex = this.findStartIndex(scrollTop)
			const endIndex = this.findEndIndex(
				scrollTop + this.containerHeight,
				startIndex,
			)

			console.log(
				"🚀 ~ updateVisibleItems ~ rangeChange:",
				startIndex,
				endIndex + 1,
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
		},
		findStartIndex(scrollTop) {
			let low = 0
			let high = this.data.length - 1

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

		onScroll: throttle(
			function (e) {
				const { scrollTop } = e.detail
				this.updateVisibleItems(scrollTop)
				// this.updateSliderPosition(scrollTop)
			},
			20,
			{ heading: true },
		),
		onSliderTouchStart(e) {
			this.isDragging = true
		},

		onSliderTouchMove(e) {
			if (!this.isDragging) return
			const touch = e.touches[0]
			let newPosition = touch.clientY - this.sliderHeight / 2
			newPosition = Math.max(
				0,
				Math.min(newPosition, this.containerHeight - this.sliderHeight),
			)
			console.log("🚀 ~ onSliderTouchMove ~ newPosition:", newPosition)
			this.sliderPosition = newPosition

			const scrollPercentage =
				newPosition / (this.containerHeight - this.sliderHeight)
			const scrollTop =
				scrollPercentage * (this.totalHeight - this.containerHeight)
			this.virtualListScrollTop = scrollTop
		},

		onSliderTouchEnd() {
			this.isDragging = false
		},

		updateSliderPosition(scrollTop) {
			const scrollPercentage =
				scrollTop / (this.totalHeight - this.containerHeight)
			this.sliderPosition =
				scrollPercentage * (this.containerHeight - this.sliderHeight)
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


    .slider {
      width: 100%;
      background-color: pink;
      position: absolute;
      border-radius: 20px;
      left: 0px;
      height: 20px;
      width: 20px;
    }
  }
}
</style>
