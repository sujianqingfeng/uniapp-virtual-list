<template>
  <view class="calc-chat-item" v-if="show">
    <view class="calc-chat-item-content">
      <view>
        <text>放放哈哈哈放哈哈哈放哈哈哈放哈哈哈哈放哈哈，</text>
      </view>
      <canvas  style="width: 100%; height: 20px; " canvas-id="canvas" id="canvas"></canvas>
    </view>
  </view>
</template>


<script>
export default {
	name: "CalcChatItem",
	data() {
		return {
			show: true,
		}
	},
	mounted() {
		this.queryContentRect()
	},
	methods: {
		queryContentRect() {
			const query = uni.createSelectorQuery().in(this)
			query
				.select(".calc-chat-item-content")
				.boundingClientRect((rect) => {
					this.measureText(rect)
				})
				.exec()
		},
		measureText({ width }) {
			const ctx = uni.createCanvasContext("canvas")
			ctx.setFontSize(16)

			const characters = {
				chinese: "中",
				number: "0",
				english: "A",
			}

			const measures = {}

			for (const [type, char] of Object.entries(characters)) {
				const metrics = ctx.measureText(char)
				measures[type] = metrics.width
			}

			this.$emit("measure", {
				width: width - 20,
				measures,
			})

			this.show = false
		},
	},
}
</script>

<style lang="scss" scoped>
.calc-chat-item {
  width: 100%;
  padding: 10px 20px;
  box-sizing: border-box;
  // display: none;
  opacity: 0;
  position: absolute;

  &-header {
    display: flex;
    align-items: center;
  }

  &-content {
    margin-top: 10px;
    padding: 10px;
    background-color: #fff;
    border-radius: 10px;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 16px;
  }
}
</style>

