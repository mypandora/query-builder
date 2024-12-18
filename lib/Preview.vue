<template>
  <div css="preview-styles">{{ item.name || "无内容" }}</div>
</template>

<script>
export default {
  name: "Preview",
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {},
};
</script>
