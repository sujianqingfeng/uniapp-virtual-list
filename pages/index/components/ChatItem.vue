<template>
  <view class="chat-item">
    <view class="chat-item-header">
      <view class="name">{{item.name}}-{{item.top}}-{{item.height}}</view>
    </view>
    <view class="chat-item-content">
      {{ item.content }}
    </view>
  </view>
</template>


<script>
export default {
	name: "ChatItem",
	props: {
		item: {
			type: Object,
			default: () => {},
		},
	},
}
</script>

<style lang="scss" scoped>
.chat-item {
  width: 100%;
  padding: 10px 20px;
  box-sizing: border-box;

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
    line-height: 16px;
    line-height: 20px;
  }
}
</style>

