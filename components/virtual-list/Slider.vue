<template>
  <view class="slider-container">

    <view class="slider-inner-container">
      <view
        class="slider"
        :style="{ top: `${sliderPosition}%` }"
        @touchstart.stop="onSliderTouchStart"
        @touchmove.stop="onSliderTouchMove"
        @touchend.stop="onSliderTouchEnd"
      ></view>
    </view>
  </view>
</template>

<script>
import { throttle } from "./utils"

export default {
	name: "Slider",
	props: {
		value: {
			type: Number,
			default: 0,
		},
	},
	data() {
		return {
			isDragging: false,
			percentage: 0,
			innerContainerRect: null,
			throttledUpdateSliderPosition: null,
		}
	},
	created() {
		this.throttledUpdateSliderPosition = throttle(this.updateSliderPosition, 16) // ~60fps
	},
	watch: {
		value: {
			immediate: true,
			handler(newValue) {
				this.percentage = newValue
			},
		},
	},
	mounted() {
		this.queryInnerContainerRect()
	},
	computed: {
		sliderPosition() {
			const sliderHeight = 20
			if (this.innerContainerRect) {
				const maxPosition =
					100 - (sliderHeight / this.innerContainerRect.height) * 100
				const minPosition =
					(sliderHeight / 2 / this.innerContainerRect.height) * 100
				return Math.max(minPosition, Math.min(this.percentage, maxPosition))
			}
			return this.percentage
		},
	},
	methods: {
		queryInnerContainerRect() {
			const query = uni.createSelectorQuery().in(this)
			query
				.select(".slider-inner-container")
				.boundingClientRect((rect) => {
					this.innerContainerRect = rect
				})
				.exec()
		},
		onSliderTouchStart(e) {
			this.isDragging = true
			this.updateSliderPosition(e.touches[0].clientY)
		},
		onSliderTouchMove(e) {
			if (!this.isDragging) return
			this.throttledUpdateSliderPosition(e.touches[0].clientY)
			this.$emit("dragging", true)
		},
		onSliderTouchEnd() {
			this.isDragging = false
			this.$emit("dragging", false)
		},
		updateSliderPosition(clientY) {
			if (!this.innerContainerRect) return
			const percentage =
				((clientY - this.innerContainerRect.top) /
					this.innerContainerRect.height) *
				100
			this.updatePercentage(percentage)
		},
		updatePercentage(percentage) {
			this.percentage = Math.max(0, Math.min(100, percentage))
			this.$emit("input", this.percentage)
		},
	},
}
</script>

<style lang="scss" scoped>
.slider-container {
  height: 100%;
  position: relative;
}
.slider-inner-container {
  height: 100%;
  width: 20px;
  position: relative;
  .slider {
    background-color: pink;
    position: absolute;
    border-radius: 20px;
    left: 0;
    height: 20px;
    width: 20px;
    transform: translateY(-50%);
    transition: none; // Remove transition for instant response
  }
}
</style>