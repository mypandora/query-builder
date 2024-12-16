<template>
  <div class="tree">
    <tree-group v-for="d in root" :key="d.id" :data="d" :level="0" :operatorText="operatorText">
      <template #default="{ data }">
        <slot v-bind:data="data" v-bind:onUpdate="(key, value) => updateItemValue(data, key, value)"></slot>
      </template>
    </tree-group>

    <!-- 空数据时 -->
    <div class="el-tree__empty-block" v-if="isEmpty">
      <slot name="empty">{{ emptyText }}</slot>
    </div>
  </div>
</template>

<script>
import { nanoid } from "nanoid";
import TreeGroup from "./TreeGroup.vue";

export default {
  name: "Tree",
  components: {
    TreeGroup,
  },
  props: {
    data: {
      type: Array,
      default: () => [],
    },
    operatorText: {
      type: Object,
      default: () => ({
        and: "且",
        or: "或",
      }),
    },
    emptyText: {
      type: String,
      default() {
        return "暂无数据";
      },
    },
  },
  provide() {
    return {
      tree: {
        remove: (id) => this.remove(this.root, id),
        insertBefore: (targetId, newItem) => this.insertBefore(this.root, targetId, newItem),
        insertAfter: (targetId, newItem) => this.insertAfter(this.root, targetId, newItem),
        insertChild: (targetId, newItem) => this.insertChild(this.root, targetId, newItem),
        find: (itemId) => this.find(this.root, itemId),
        getPathToItem: (targetId) => this.getPathToItem({ current: this.root, targetId }),
        toggle: (itemId) => this.toggle(this.root, itemId),
        collapse: (itemId) => this.collapse(this.root, itemId),
        expand: (itemId) => this.expand(this.root, itemId),
        toggleOperator: (itemId) => this.toggleOperator(this.root, itemId),
        uniqueContextId: Symbol("uniqueId"),
      },
    };
  },
  data() {
    return {
      root: this.handleFormTreeData(this.data),
    };
  },
  computed: {
    isEmpty() {
      return this.data.length === 0;
    },
  },
  watch: {
    root: {
      deep: true,
      handler(newValue, oldValue) {
        console.log("newValue :>> ", newValue);
        console.log("oldValue :>> ", oldValue);
        this.$emit("update:data", newValue);
      },
    },
  },
  methods: {
    /**
     * 递归处理树结构数据，为其添加 id 等属性
     * @param node 树结构数据
     * @returns 一个新树
     */
    handleFormTreeData(node) {
      function fid(node) {
        // Create a shallow copy of the node
        const newNode = { ...node };
        if (newNode.id === undefined) {
          newNode.id = nanoid();
        }

        // If the node has children, recursively add IDs to them
        if (Array.isArray(newNode.children)) {
          newNode.children = newNode.children.map(fid);
        }

        return newNode;
      }

      return node.map(fid);
    },

    /**
     * 更新节点值
     * 该方法主要通过递归方式更新自定义插槽
     * @param node 当前节点
     * @param key 当前节点的 key
     * @param value 当前节点的 value
     */
    updateItemValue(node, key, value) {
      const item = this.find(this.root, node.id);
      if (item) {
        this.$set(item, key, value);
      }
    },

    //
    remove(data, id) {
      return data
        .filter((item) => item.id !== id)
        .map((item) => {
          if (this.hasChildren(item)) {
            return {
              ...item,
              children: this.remove(item.children, id),
            };
          }
          return item;
        });
    },
    insertBefore(data, targetId, newItem) {
      return data.flatMap((item) => {
        if (item.id === targetId) {
          return [newItem, item];
        }
        if (this.hasChildren(item)) {
          return {
            ...item,
            children: this.insertBefore(item.children, targetId, newItem),
          };
        }
        return item;
      });
    },
    insertAfter(data, targetId, newItem) {
      return data.flatMap((item) => {
        if (item.id === targetId) {
          return [item, newItem];
        }
        if (this.hasChildren(item)) {
          return {
            ...item,
            children: this.insertAfter(item.children, targetId, newItem),
          };
        }
        return item;
      });
    },
    insertChild(data, targetId, newItem) {
      return data.flatMap((item) => {
        if (item.id === targetId) {
          return {
            ...item,
            isOpen: true,
            children: [newItem, ...item.children],
          };
        }

        if (!this.hasChildren(item)) {
          return item;
        }

        return {
          ...item,
          children: this.insertChild(item.children, targetId, newItem),
        };
      });
    },
    find(data, itemId) {
      for (const item of data) {
        if (item.id === itemId) {
          return item;
        }

        if (this.hasChildren(item)) {
          const result = this.find(item.children, itemId);
          if (result) {
            return result;
          }
        }
      }
    },
    getPathToItem({ current, targetId, parentIds = [] }) {
      for (const item of current) {
        if (item.id === targetId) {
          return parentIds;
        }
        const nested = this.getPathToItem({
          current: item.children,
          targetId: targetId,
          parentIds: [...parentIds, item.id],
        });
        if (nested) {
          return nested;
        }
      }
    },
    hasChildren(item) {
      return item.children?.length > 0;
    },
    toggle(data, id) {
      const item = this.find(data, id);
      if (item) {
        this.$set(item, "isOpen", !item.isOpen);
      }
    },
    collapse(data, id) {
      const item = this.find(data, id);
      if (item) {
        this.$set(item, "isOpen", false);
      }
    },
    expand(data, id) {
      const item = this.find(data, id);
      if (item) {
        this.$set(item, "isOpen", true);
      }
    },
    toggleOperator(data, id) {
      const item = this.find(data, id);
      if (item) {
        this.$set(item, "operator", item.operator === "and" ? "or" : "and");
      }
    },

    dataReducer(action) {
      const data = this.root;
      console.log("action", action);

      const item = this.find(data, action.itemId);
      if (!item) {
        return data;
      }

      if (action.type === "instruction") {
        const instruction = action.instruction;

        if (instruction.type === "reparent") {
          const path = this.getPathToItem({
            current: data,
            targetId: action.targetId,
          });
          const desiredId = path[instruction];
          let result = this.remove(data, action.itemId);
          result = this.insertAfter(result, desiredId, item);
          return result;
        }

        if (action.itemId === action.targetId) {
          return data;
        }

        if (instruction.type === "reorder-above") {
          let result = this.remove(data, action.itemId);
          result = this.insertBefore(result, action.targetId, item);
          return result;
        }

        if (instruction.type === "reorder-below") {
          let result = this.remove(data, action.itemId);
          result = this.insertAfter(result, action.targetId, item);
          return result;
        }

        if (instruction.type === "make-child") {
          let result = this.remove(data, action.itemId);
          result = this.insertChild(result, action.targetId, item);
          return result;
        }

        console.warn("TODO: action not implemented", instruction);

        return data;
      }

      return data;
    },
    handleNodeDrop({ sourceId, targetId, position }) {
      // 首先从原位置移除节点
      const sourceNode = this.find(this.root, sourceId);
      if (!sourceNode) return;

      // 克隆源节点，避免引用问题
      const clonedNode = JSON.parse(JSON.stringify(sourceNode));

      // 移除原节点
      this.remove(this.root, sourceId);

      // 根据放置位置插入节点
      if (position === "top") {
        this.insertBefore(this.root, targetId, clonedNode);
      } else if (position === "bottom") {
        this.insertAfter(this.root, targetId, clonedNode);
      }

      // 触发更新事件
      this.$emit("update:data", this.root);
    },
  },
};
</script>

<style>
.tree {
  height: 100%;
  overflow: auto;
}
</style>
