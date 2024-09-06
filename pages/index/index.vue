<template>
  <view class="content">
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
      <VirtualList :data="list" @rangeChange="onRangeChange" @totalHeightChange="onTotalHeightChange">
        <template #default="{ items }">
          <VirtualItem v-for="item in items" :key="item.id" :id="item.id" :item="item">
            <ChatItem :item="item" />
          </VirtualItem>
        </template>
      </VirtualList>
    </view>
  </view>
</template>

<script>
import { VirtualList, VirtualItem } from "@/components/virtual-list"
import ChatItem from "./components/ChatItem.vue"

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

const list = Array.from({ length: 100 }, (_, i) => {
	return {
		name: `name-${i}`,
		content: randomString(),
		id: i,
	}
})

export default {
	components: { VirtualList, VirtualItem, ChatItem },
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
	onLoad() {},
	mounted() {},
	methods: {
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
  height: 100%;
}

.content {
  background-color: #f8f8f8;
  height: 100%;
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
