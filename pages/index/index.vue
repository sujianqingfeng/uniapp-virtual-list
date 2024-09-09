<template>
  <view class="content">
    <view style="height: var(--status-bar-height);"></view>
    <view class="header">
      
      <view class="title">VirtualList</view>
      <view class="info">
        <view>
          totalHeight: {{ totalHeight }}
        </view>
        <view>
          {{ range.startIndex }} - {{ range.endIndex }}
        </view>

      </view>
    </view>

    <view class="list">
      <CalcChatItem @measure="onMeasure" />
      <virtual-list :data="list" @rangeChange="onRangeChange" @totalHeightChange="onTotalHeightChange">
        <template #default="{ items }">
          <virtual-item v-for="item in items" :key="item.id" :id="item.id" :item="item">
            <chat-item :item="item" />
          </virtual-item>
        </template>
      </virtual-list>
    </view>
  </view>
</template>

<script>
import ChatItem from "./components/ChatItem.vue"
import VirtualList from "@/components/virtual-list/VirtualList.vue"
import VirtualItem from "@/components/virtual-list/VirtualItem.vue"
import CalcChatItem from "./components/CalcChatItem.vue"

const randomString = () => {
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	const length = Math.floor(Math.random() * (200 - 100 + 1)) + 10 // Random length between 100 and 200
	let result = ""
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length))
	}
	return result
}

const list = Array.from({ length: 3000 }, (_, i) => {
	return {
		name: `name-${i + 1}`,
		content: randomString(),
		id: i + 1,
		height: 100,
	}
})

export default {
	components: { VirtualList, VirtualItem, ChatItem, CalcChatItem },
	data() {
		return {
			list,
			totalHeight: 0,
			range: {
				startIndex: 0,
				endIndex: 0,
			},
		}
	},
	methods: {
		onMeasure({ width, measures }) {
			this.list = this.list.map((item) => ({
				...item,
				height: this.calculateItemHeight(item.content, width, measures),
			}))
		},
		calculateItemHeight(content, width, measures) {
			const baseHeight = 75 // Base height for padding and margins
			const lineHeight = 20 // Approximate line height

			let totalWidth = 0
			let lines = 1

			for (const char of content) {
				if (char >= "0" && char <= "9") {
					totalWidth += measures.number
				} else if (/[a-zA-Z]/.test(char)) {
					totalWidth += measures.english
				} else {
					totalWidth += measures.chinese
				}

				if (totalWidth > width) {
					lines++
					totalWidth = 0
				}
			}

			return baseHeight + lines * lineHeight
		},
		onTotalHeightChange(h) {
			this.totalHeight = h
		},
		onRangeChange(range) {
			this.range = range
		},
	},
}
</script>


<style scoped>
page {
  height: 100vh;
}

.content {
  background-color: #f8f8f8;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  .header {
    display: flex;
    align-items: center;
    padding: 20px;
    gap: 10px;

    .title {
      font-size: 32px;
      font-weight: bold;

    }
  }

  .list {
    height: 0;
    flex: 1;
  }
}
</style>
