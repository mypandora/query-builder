<template>
  <div>
    <!-- 多数据时 -->
    <div v-if="data.children?.length" class="tree-group">
      <div class="content-center cursor-pointer" @click="() => tree.toggleOperator(data.id)">
        {{ operatorText[data.operator] }}
      </div>
      <div class="content-center cursor-pointer" @click="() => tree.toggle(data.id)">
        <icon-expand v-if="data.isOpen" />
        <icon-collapse v-else />
      </div>
      <div v-if="data.isOpen" class="tree-group--box">
        <div class="box--brackets"></div>
        <div class="tree-subtree">
          <tree-node
            v-for="child in data.children"
            :key="child.id"
            :node="child"
            :level="level + 1"
            :operatorText="operatorText"
          >
            <template #default="slotProps">
              <slot v-bind="slotProps"></slot>
            </template>
          </tree-node>
        </div>
      </div>
      <div v-else class="tree-group-text">展开{{ data.children?.length || 0 }}个子条件</div>
    </div>

    <!--单数据时 -->
    <div v-else class="content condition" style="padding: 8px">
      <tree-node :node="data" :level="level + 1">
        <template #default="slotProps">
          <slot v-bind="slotProps"></slot>
        </template>
      </tree-node>
    </div>
  </div>
</template>

<script>
import TreeNode from "./TreeNode.vue";
import IconExpand from "./IconExpand.vue";
import IconCollapse from "./IconCollapse.vue";

export default {
  name: "TreeGroup",
  components: {
    TreeNode,
    IconExpand,
    IconCollapse,
  },
  inject: ["tree"],
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
    level: {
      type: Number,
      default: 0,
    },
    emptyText: {
      type: String,
      default() {
        return "暂无数据";
      },
    },
    operatorText: {
      type: Object,
      default: () => ({
        and: "并且",
        or: "或者",
      }),
    },
  },
  data() {
    return {};
  },
};
</script>
