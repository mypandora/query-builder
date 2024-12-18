<template>
  <div v-if="isBlocked" :style="getStyle(instruction.desired, true)" :class="getClass(instruction.desired)"></div>
  <div v-else :style="getStyle(instruction, false)" :class="getClass(instruction)"></div>
</template>

<script>
export default {
  name: "DropIndicator",
  props: {
    instruction: {
      type: Object,
      default: () => ({
        type: "reorder-above", // 'reorder-below', 'make-child', 'reparent', 'instruction-blocked'
      }),
    },
  },
  data() {
    return {};
  },
  computed: {
    isBlocked() {
      return this.instruction.type === "instruction-blocked";
    },
  },
  methods: {
    getStyle(instruction, isBlocked) {
      const style = {
        "--indicator-color": !isBlocked ? "#579DFF" : "var(--warning-color)", // Replace token with actual value
      };

      return style;
    },

    getClass(instruction) {
      switch (instruction.type) {
        case "reorder-above":
          return ["line-styles", "line-above-styles"];
        case "reorder-below":
          return ["line-styles", "line-below-styles"];
        case "make-child":
          return ["outline-styles"];
        case "reparent":
          return ["line-styles", "line-below-styles"];
        default:
          return [];
      }
    },
  },
};
</script>
