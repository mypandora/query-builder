<template>
  <div class="tree-node" ref="treeNodeRef">
    <TreeGroup v-if="node.children?.length" :data="node" :level="level + 1" :operatorText="operatorText">
      <template #default="slotProps">
        <slot v-bind="slotProps"></slot>
      </template>
    </TreeGroup>

    <div v-else class="item">
      <div class="item-nohover">
        <slot :data="node"> 无内容 </slot>
      </div>
    </div>

    <drop-indicator v-if="instruction" :instruction="instruction" />
  </div>
</template>

<script>
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import DropIndicator from "./DropIndicator.vue";

function getParentLevelOfInstruction(instruction) {
  if (instruction.type === "instruction-blocked") {
    return getParentLevelOfInstruction(instruction.desired);
  }
  if (instruction.type === "reparent") {
    return instruction.desiredLevel - 1;
  }
  return instruction.currentLevel - 1;
}

function delay({ waitMs: timeMs, fn }) {
  let timeoutId = window.setTimeout(() => {
    timeoutId = null;
    fn();
  }, timeMs);
  return function cancel() {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
}

export default {
  name: "TreeNode",
  components: {
    DropIndicator,
    TreeGroup: () => import("./TreeGroup.vue"),
  },
  inject: ["tree"],
  props: {
    node: {
      type: Object,
      default: () => ({}),
    },
    level: {
      type: Number,
      default: 0,
    },
    operatorText: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      state: "idle",
      cleanup: null,
      isDragging: false,
      closestEdge: null,
      cancelExpand: null,
      instruction: null,
    };
  },
  methods: {
    setupDragAndDrop() {
      if (!this.$refs.treeNodeRef) return;

      const cleanup = combine(
        draggable({
          element: this.$refs.treeNodeRef,
          getInitialData: () => ({
            id: this.node.id,
            type: "tree-node",
            isOpenOnDragStart: this.node.isOpen,
            uniqueContextId: this.tree.uniqueContextId,
          }),
          onDragStart: ({ source }) => {
            this.isDragging = true;
            if (source.data.isOpenOnDragStart) {
              this.tree.collapse(this.node.id);
            }
          },
          onDrop: ({ source }) => {
            this.isDragging = false;
            if (source.data.isOpenOnDragStart) {
              this.tree.expand(this.node.id);
            }
          },
        }),
        dropTargetForElements({
          element: this.$refs.treeNodeRef,
          getData: ({ input, element }) => {
            const data = { id: this.node.id };

            return attachInstruction(data, {
              input,
              element,
              indentPerLevel: 0,
              currentLevel: this.level,
              block: [],
            });
          },
          canDrop: ({ source }) => {
            return source.data.type === "tree-node" && source.data.uniqueContextId === this.tree.uniqueContextId;
          },
          getIsSticky: () => true,
          onDrag: ({ self, source }) => {
            const instruction = extractInstruction(self.data);
            console.log("instruction", instruction);

            if (source.data.id !== this.node.id) {
              if (
                instruction?.type === "make-child" &&
                this.node?.children?.length &&
                !this.node.isOpen &&
                !this.cancelExpand
              ) {
                this.cancelExpand = delay({
                  waitMs: 500,
                  fn: () => this.tree.expand(this.node.id),
                });
              }
              if (instruction?.type !== "make-child" && this.cancelExpand) {
                this.cancelExpand = null;
              }

              this.instruction = instruction;
              return;
            }
            if (instruction?.type === "reparent") {
              this.instruction = instruction;
              return;
            }
            this.instruction = null;
          },
          onDragLeave: () => {
            this.cancelExpand = null;
            this.instruction = null;
          },
          onDrop: () => {
            this.cancelExpand = null;
            this.instruction = null;
          },
        }),
        monitorForElements({
          canMonitor: ({ source }) => source.data.uniqueContextId === this.uniqueContextId,
          onDragStart: this.updateIsParentOfInstruction,
          onDrag: this.updateIsParentOfInstruction,
          onDrop() {
            this.clearParentOfInstructionState();
          },
        }),
      );

      this.cleanup = cleanup;
    },

    updateIsParentOfInstruction({ location }) {
      if (this.shouldHighlightParent(location)) {
        this.state = "parent-of-instruction";
        return;
      }
      this.clearParentOfInstructionState();
    },
    clearParentOfInstructionState() {
      return this.state === "parent-of-instruction" ? "idle" : this.state;
    },
    shouldHighlightParent(location) {
      const target = location.current.dropTargets[0];

      if (!target) {
        return false;
      }

      const instruction = extractInstruction(target.data);

      if (!instruction) {
        return false;
      }

      const targetId = target.data.id;

      const path = this.tree.getPathToItem(targetId);
      const parentLevel = getParentLevelOfInstruction(instruction);
      const parentId = path[parentLevel];

      return parentId === this.node.id;
    },
  },
  mounted() {
    this.setupDragAndDrop();
  },
  beforeDestroy() {
    this.cleanup();
  },
};
</script>
