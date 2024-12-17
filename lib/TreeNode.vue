<template>
  <div class="tree-node" :class="{ 'inner-dragging-styles': isDragging }" ref="treeNodeRef">
    <TreeGroup v-if="node.children?.length" :data="node" :level="level + 1" :operatorText="operatorText">
      <template #default="slotProps">
        <slot v-bind="slotProps"></slot>
      </template>
    </TreeGroup>

    <div v-else class="item">
      <slot :data="node"> 无内容 </slot>
      <icon-close class="cursor-pointer" @click.native="tree.remove(node.id)" />
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
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import DropIndicator from "./DropIndicator.vue";
import IconClose from "./IconClose.vue";

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
    IconClose,
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
      instruction: null,
      cancelExpandRef: null,
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
          onGenerateDragPreview: ({ nativeSetDragImage }) => {
            setCustomNativeDragPreview({
              getOffset: pointerOutsideOfPreview({ x: "16px", y: "8px" }),
              render: ({ container }) => {
                // Create our preview element
                const preview = document.createElement("div");

                // Populate and style the preview element however you like
                preview.textContent = "My Preview";
                Object.assign(preview.style, {
                  padding: "20px",
                  backgroundColor: "lightpink",
                });

                // put the "preview" element into the container element
                container.appendChild(preview);
              },
              nativeSetDragImage,
            });
          },
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
              // expand after 500ms if still merging
              if (
                instruction?.type === "make-child" &&
                this.node.children?.length &&
                !this.node.isOpen &&
                !this.cancelExpandRef
              ) {
                this.cancelExpandRef = delay({
                  waitMs: 500,
                  fn: () => this.tree.expand(this.node.id),
                });
              }
              if (instruction?.type !== "make-child" && this.cancelExpandRef) {
                this.cancelExpand();
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
            this.cancelExpand();
            this.instruction = null;
          },
          onDrop: () => {
            this.cancelExpand();
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
    cancelExpand() {
      this.cancelExpandRef?.();
      this.cancelExpandRef = null;
    },
  },
  mounted() {
    this.setupDragAndDrop();
  },
  beforeDestroy() {
    this.cleanup();
    this.cancelExpand();
  },
};
</script>
