<template>
  <div
    class="tree-item"
    :class="{
      'inner-dragging-styles': state === 'dragging',
      'parent-of-instruction-styles': state === 'parent-of-instruction',
    }"
    ref="treeItemRef"
  >
    <TreeGroup v-if="node.children?.length" :data="node" :level="level + 1" :operatorText="operatorText">
      <template #default="slotProps">
        <slot v-bind="slotProps"></slot>
      </template>
    </TreeGroup>

    <div v-else class="item">
      <slot :data="node"> 无内容 </slot>
      <icon-close class="cursor-pointer" @click.native="tree.remove(node.id)" />
    </div>

    <drop-indicator v-if="instruction" :instruction="instruction" :edge="closestEdge" />
  </div>
</template>

<script>
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { attachInstruction, extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { attachClosestEdge, extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
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
  name: "TreeItem",
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
      instruction: null,
      closestEdge: null,
      cancelExpandRef: null,
    };
  },
  methods: {
    setupDragAndDrop() {
      if (!this.$refs.treeItemRef) return;

      const cleanup = combine(
        draggable({
          element: this.$refs.treeItemRef,
          getInitialData: () => ({
            id: this.node.id,
            type: "tree-item",
            isOpenOnDragStart: this.node.isOpen,
            uniqueContextId: this.tree.uniqueContextId,
          }),
          onDragStart: ({ source }) => {
            this.state = "dragging";
            if (source.data.isOpenOnDragStart) {
              this.tree.collapse(this.node.id);
            }
          },
          onDrop: ({ source }) => {
            this.state = "idle";
            if (source.data.isOpenOnDragStart) {
              this.tree.expand(this.node.id);
            }
          },
        }),
        dropTargetForElements({
          element: this.$refs.treeItemRef,
          getData: ({ input, element }) => {
            const data = { id: this.node.id };

            return [
              attachClosestEdge(data, {
                input,
                element,
                allowedEdges: ["top", "bottom"],
              }),

              attachInstruction(data, {
                input,
                element,
                currentLevel: this.level,
                block: [],
              }),
            ];
          },
          canDrop: ({ source }) => {
            return source.data.type === "tree-item" && source.data.uniqueContextId === this.tree.uniqueContextId;
          },
          getIsSticky: () => true,
          onDrag: ({ location, self, source }) => {
            const [closestEdgeData, treeItemData] = self.data;

            const closestEdge = extractClosestEdge(closestEdgeData);
            const instruction = extractInstruction(treeItemData);

            this.closestEdge = closestEdge;

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

              if (location.current.dropTargets.length > 1) {
                // console.log("location", this.node?.name, this, location);

                if (this.node?.children) {
                  this.instruction = null;
                  return;
                }
              }

              this.instruction = instruction;
              return;
            }
            if (instruction?.type === "reparent") {
              this.instruction = instruction;
              return;
            }
            this.instruction = null;
            this.closestEdge = null;
          },
          onDragLeave: () => {
            this.cancelExpand();
            this.instruction = null;
            this.closestEdge = null;
          },
          onDrop: () => {
            this.cancelExpand();
            this.instruction = null;
            this.closestEdge = null;
          },
        }),
        monitorForElements({
          canMonitor: ({ source }) => source.data.uniqueContextId === this.tree.uniqueContextId,
          onDragStart: this.updateIsParentOfInstruction,
          onDrag: this.updateIsParentOfInstruction,
          onDrop: () => {
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
