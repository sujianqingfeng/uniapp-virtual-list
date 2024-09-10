<template>
  <view class="calc-chat-item" v-if="show">
    <view class="calc-chat-item-header">
      <view class="name">name</view>
    </view>
    <view class="calc-chat-item-content">
      <view class="calc-chat-item-content-inner">
        <text v-for="(char, index) in measureChars" :key="index"
          :class="['calc-chat-item-content-text', `char-text-${index}`]">{{ char }}</text>
      </view>
    </view>
  </view>
</template>


<script>
export default {
  name: "CalcChatItem",
  data() {
    return {
      show: true,
      itemHeight: 0,
      measureChars: ['A', '中', '1','a'],
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.queryContentRect()
    })
  },
  methods: {
    queryContentRect() {
      const query = uni.createSelectorQuery().in(this)

      query.select('.calc-chat-item').boundingClientRect((rect) => {
        this.itemHeight = rect.height
      }).exec()

      query
        .select(".calc-chat-item-content-inner")
        .boundingClientRect((rect) => {
          this.calculateMeasurements(rect)
        })
        .exec()
    },
    calculateMeasurements({ width, height }) {
      const totalWidth = width
      const charHeight = height

      const query = uni.createSelectorQuery().in(this)

      for (let i = 0; i < this.measureChars.length; i++) {
        query
          .select(`.char-text-${i}`)
          .boundingClientRect()
      }

      query
        .exec(rects => {
          if (rects.length === this.measureChars.length) {
            const [englishRect, chineseRect, numberRect, englishRect2] = rects

            const englishWidth = englishRect.width
            const chineseWidth = chineseRect.width
            const numberWidth = numberRect.width
            const englishWidth2 = englishRect2.width

            this.$emit("measure", {
              width: totalWidth,
              baseHeight: this.itemHeight - charHeight,
              measures: {
                english: englishWidth,
                english2: englishWidth2,
                chinese: chineseWidth,
                number: numberWidth,
              },
            })

          }
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
