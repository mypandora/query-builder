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
        currentLevel: 0,
        indentPerLevel: 0,
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
        "--horizontal-indent": `${instruction.currentLevel * instruction.indentPerLevel}px`,
        "--indicator-color": !isBlocked ? "#579DFF" : "var(--warning-color)", // Replace token with actual value
      };

      if (instruction.type === "reparent") {
        style["--horizontal-indent"] = `${instruction.desiredLevel * instruction.indentPerLevel}px`;
      }

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

<style>
.line-styles {
  --terminal-size: 8px;
  /* To make things a bit clearer we are making the box that the indicator in as
	   big as the whole tree item */
  position: absolute;
  top: 0;
  right: 0;
  left: var(--horizontal-indent);
  bottom: 0;

  /* We don't want to cause any additional 'dragenter' events */
  pointer-events: none;
}
/* Terminal */
.line-styles::before {
  display: block;
  content: "";
  position: absolute;
  z-index: 2;

  box-sizing: border-box;
  width: var(--terminal-size);
  height: var(--terminal-size);
  left: 0;
  background: transparent;
  border-color: var(--indicator-color);
  border-width: 2px;
  border-radius: 50%;
  border-style: solid;
}
/* Line */
.line-styles::after {
  display: block;
  content: "";
  position: absolute;
  z-index: 1;
  background: var(--indicator-color);
  /*  putting the line to the right of the terminal */
  left: calc(var(--terminal-size) / 2);
  height: 2px;
  right: 0;
}

/* terminal */
.line-above-styles::before {
  top: 0;
  /* move to position to be a 'cap' on the line */
  transform: translate(calc(-0.5 * var(--terminal-size)), calc(-0.5 * var(--terminal-size)));
}
/* line */
.line-above-styles::after {
  top: -1px;
}

.line-below-styles::before {
  bottom: 0;
  /* move to position to be a 'cap' on the line */
  transform: translate(calc(-0.5 * var(--terminal-size)), calc(0.5 * var(--terminal-size)));
}
/* line */
.line-below-styles::after {
  bottom: -1px;
}

.outline-styles {
  /* To make things a bit clearer we are making the box that the indicator in as
	big as the whole tree item */
  position: absolute;
  top: 0;
  right: 0;
  left: var(--horizontal-indent);
  bottom: 0;

  /* We don't want to cause any additional 'dragenter' events */
  pointer-events: none;

  border: 2px solid var(--indicator-color);
  /* TODO: make this a prop?
	For now: matching the Confluence tree item border radius */
  border-radius: 3px;
}
</style>
