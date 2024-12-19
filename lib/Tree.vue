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
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import TreeGroup from "./TreeGroup.vue";
import { isEqual, deepClone } from "./utils";
import "./tree.css";

let nodeIdSeed = 0;

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
        uniqueContextId: this.uniqueContextId,
      },
    };
  },
  data() {
    return {
      uniqueContextId: Symbol("uniqueId"),
      root: [],
    };
  },
  computed: {
    isEmpty() {
      return this.root?.length === 0;
    },
  },
  watch: {
    data: {
      deep: true,
      immediate: true,
      handler(newValue) {
        if (!isEqual(newValue, this.root)) {
          this.root = deepClone(this.handleFormTreeData(newValue));
        }
      },
    },
    root: {
      deep: true,
      handler(newValue) {
        if (!isEqual(newValue, this.data)) {
          this.flattenChildren(newValue);
          this.$emit("update:data", deepClone(newValue));
        }
      },
    },
  },
  mounted() {
    const cleanup = combine(
      monitorForElements({
        canMonitor: ({ source }) => source.data.uniqueContextId === this.uniqueContextId,
        onDrop: (args) => {
          const { location, source } = args;
          // didn't drop on anything
          if (!location.current.dropTargets.length) {
            return;
          }

          if (source.data.type === "tree-item") {
            const itemId = source.data.id;

            const target = location.current.dropTargets[0];
            const targetId = target.data[1].id;

            const closestEdge = extractClosestEdge(target.data[0]);
            const instruction = extractInstruction(target.data[1]);

            if (instruction) {
              this.dataReducer({
                type: "instruction",
                instruction,
                itemId,
                targetId,
                edge: closestEdge,
              });
            }
          }
        },
      }),
    );

    this.cleanup = cleanup;
  },
  beforeDestroy() {
    this.cleanup();
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
          newNode.id = nodeIdSeed++;
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

    /**
     * 打平树。
     * 假如节点只有一个子节点，则会直接替换为子节点
     * @param {Array} data - 树形数据
     */
    flattenChildren(data) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];

        // 如果节点只有一个子节点，直接替换为父级
        if (item.children && item.children.length === 1) {
          data.splice(i, 1, item.children[0]);
        } else if (item.children && item.children.length > 0) {
          this.flattenChildren(item.children); // 递归处理子节点
        }
      }
    },

    /**
     * 递归删除节点
     * @param data
     * @param id
     */
    remove(data, id) {
      for (let i = data.length - 1; i >= 0; i--) {
        const item = data[i];
        if (item.id === id) {
          // 直接删除当前节点
          data.splice(i, 1);
        } else if (this.hasChildren(item)) {
          // 递归删除子节点
          this.remove(item.children, id);

          // 如果子节点处理完后为空，可以选择删除空 children 数组
          if (item.children.length === 0) {
            delete item.children;
          }
        }
      }
    },

    /**
     * 递归插入节点，直接修改原对象
     * @param {Array} data - 数据列表
     * @param {String|Number} targetId - 目标节点的 ID
     * @param {Object} newItem - 要插入的新节点
     * @returns {Boolean} 是否成功插入
     */
    insertBefore(data, targetId, newItem) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.id === targetId) {
          // 在目标节点前插入新节点
          data.splice(i, 0, newItem);
          return true; // 插入成功，直接返回
        }
        if (this.hasChildren(item)) {
          // 递归子节点
          const result = this.insertBefore(item.children, targetId, newItem);
          if (result) return true; // 子节点中已插入，直接返回
        }
      }
      return false; // 未找到目标节点
    },

    /**
     * 递归插入节点，直接修改原对象
     * @param {Array} data - 数据列表
     * @param {String|Number} targetId - 目标节点的 ID
     * @param {Object} newItem - 要插入的新节点
     * @returns {Boolean} 是否成功插入
     */
    insertAfter(data, targetId, newItem) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (item.id === targetId) {
          // 在目标节点后插入新节点
          data.splice(i + 1, 0, newItem);
          return true; // 插入成功，直接返回
        }
        if (this.hasChildren(item)) {
          // 递归子节点
          const result = this.insertAfter(item.children, targetId, newItem);
          if (result) return true; // 子节点中已插入，直接返回
        }
      }
      return false; // 未找到目标节点
    },

    /**
     * 将新节点与目标节点组合成子节点，直接修改原对象
     * @param {Array} data - 数据列表
     * @param {String|Number} targetId - 目标节点的 ID
     * @param {Object} newItem - 要插入的新节点
     * @param {String} edge - 目标节点的边
     * @returns {Boolean} 是否成功插入
     */
    insertChild(data, targetId, newItem, edge) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (item.id === targetId) {
          // 创建一个新的组节点
          const newGroup = {
            id: nodeIdSeed++, // 生成唯一 ID 的方法
            isOpen: true,
            operator: "and",
            children: edge === "top" ? [newItem, item] : [item, newItem], // 将目标节点和新节点作为组的子节点
          };

          // 替换原节点为新组节点
          data.splice(i, 1, newGroup);
          return true; // 插入成功，返回
        }

        // 如果当前节点有子节点，递归处理
        if (this.hasChildren(item)) {
          const success = this.insertChild(item.children, targetId, newItem, edge);
          if (success) return true; // 如果子节点中已完成插入，直接返回
        }
      }

      return false; // 未找到目标节点，返回失败
    },

    /**
     * 递归查找节点
     * @param data
     * @param itemId
     */
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
        if (!this.hasChildren(item)) {
          continue;
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

    /**
     * 判断节点是否有子节点
     * @param item
     */
    hasChildren(item) {
      return item.children?.length > 0;
    },

    /**
     * 切换节点展开状态
     * @param data
     * @param id
     */
    toggle(data, id) {
      const item = this.find(data, id);
      if (item) {
        this.$set(item, "isOpen", !item.isOpen);
      }
    },

    /**
     * 折叠节点
     * @param data
     * @param id
     */
    collapse(data, id) {
      const item = this.find(data, id);
      if (item) {
        this.$set(item, "isOpen", false);
      }
    },

    /**
     * 展开节点
     * @param data
     * @param id
     */
    expand(data, id) {
      const item = this.find(data, id);
      if (item) {
        this.$set(item, "isOpen", true);
      }
    },

    /**
     * 切换节点操作符
     * @param data
     * @param id
     */
    toggleOperator(data, id) {
      const item = this.find(data, id);
      if (item) {
        this.$set(item, "operator", item.operator === "and" ? "or" : "and");
      }
    },

    /**
     * 节点树的数据操作
     * @param action
     */
    dataReducer(action) {
      const data = this.root;

      const item = this.find(data, action.itemId);
      if (!item) {
        return data;
      }

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
        return;
      }

      if (instruction.type === "reorder-above") {
        this.remove(data, action.itemId);
        this.insertBefore(data, action.targetId, item);
        return;
      }

      if (instruction.type === "reorder-below") {
        this.remove(data, action.itemId);
        this.insertAfter(data, action.targetId, item);
        return;
      }

      if (instruction.type === "make-child") {
        this.remove(data, action.itemId);
        this.insertChild(data, action.targetId, item, action.edge);
        return;
      }

      console.warn("TODO: action not implemented", instruction);
    },
  },
};
</script>
