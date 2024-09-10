# Uniapp-VirtualList




<video  controls>
  <source src="./screenshots/demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

- 基于scroll-view实现的虚拟列表
- 动态高度没有通过boundingClientRect查询，而是通过文字算行数，所以这个跟不同的文字类型有关系，需要算法精确才行
- 虽然加了buffer-size和任务队列，但是你滑动超级快的时候，依然会有白屏，你的计算和uniapp渲染跟不上，就会出现白屏