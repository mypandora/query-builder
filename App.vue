<template>
  <div id="app">
    <p>
      <el-button type="primary" @click="addCondition">增加条件</el-button>
    </p>
    <query-builder :data.sync="treeData" :operatorText="operatorText">
      <template #default="{ data, onUpdate }">
        <div class="item-nohover">
          <span class="item-field">{{ data.name }}</span>

          <el-select
            class="item-op"
            size="small"
            :value="data.condition"
            @change="(val) => onUpdate('condition', val)"
            placeholder="请选择"
          >
            <el-option
              v-for="item in conditionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>

          <div class="item-value">
            <el-input
              :value="data.startValue"
              @input="(val) => onUpdate('startValue', val)"
              placeholder="请输入内容"
            ></el-input>
          </div>
          <div class="item-text">至</div>
          <div class="item-value">
            <el-input
              :value="data.endValue"
              @input="(val) => onUpdate('endValue', val)"
              placeholder="请输入内容"
            ></el-input>
          </div>
        </div>
      </template>
    </query-builder>
  </div>
</template>

<script>
import QueryBuilder from "./lib/index.js";

export default {
  name: "App",
  components: {
    QueryBuilder,
  },
  data() {
    return {
      conditionOptions: [
        { label: "等于", value: "=" },
        { label: "不等于", value: "!=" },
        { label: "大于", value: ">" },
        { label: "大于等于", value: ">=" },
        { label: "小于", value: "<" },
        { label: "小于等于", value: "<=" },
        { label: "模糊匹配", value: "LIKE" },
        { label: "开头匹配", value: "%LIKE" }, // 注意：需要在值后面拼接%
        { label: "结尾匹配", value: "LIKE%" }, // 注意：需要在值前面拼接%
        { label: "包含", value: "%LIKE%" }, // 注意：需要在值前后拼接%
        { label: "为空", value: "IS NULL" },
        { label: "不为空", value: "IS NOT NULL" },
        { label: "在列表中", value: "IN" },
        { label: "不在列表中", value: "NOT IN" },
        { label: "介于之间", value: "BETWEEN" },
      ],

      operatorText: {
        and: "且",
        or: "或",
      },

      treeData: [
        {
          operator: "or",
          isOpen: true,
          children: [
            {
              operator: "and",
              isOpen: true,
              children: [
                {
                  name: "手机品牌",
                  condition: "",
                  startValue: "",
                  endValue: "",
                },
                {
                  name: "手机型号（或机型）",
                  condition: "",
                  startValue: "",
                  endValue: "",
                },
              ],
            },
            {
              operator: "and",
              isOpen: true,
              children: [
                {
                  name: "手机价格",
                  condition: "",
                  startValue: "",
                  endValue: "",
                },
                {
                  operator: "and",
                  isOpen: true,
                  children: [
                    {
                      name: "手机颜色",
                      condition: "",
                      startValue: "",
                      endValue: "",
                    },
                    {
                      name: "手机尺寸",
                      condition: "",
                      startValue: "",
                      endValue: "",
                    },
                  ],
                },
              ],
            },
            {
              name: "手机内存",
              condition: "",
              startValue: "",
              endValue: "",
            },
            {
              operator: "and",
              isOpen: true,
              children: [
                {
                  name: "手机网络",
                  condition: "",
                  startValue: "",
                  endValue: "",
                },
                {
                  name: "手机系统",
                  condition: "",
                  startValue: "",
                  endValue: "",
                },
              ],
            },
          ],
        },
        {
          operator: "or",
          isOpen: true,
          children: [
            {
              operator: "and",
              isOpen: true,
              children: [
                {
                  name: "手机品牌",
                  condition: "",
                  startValue: "",
                  endValue: "",
                },
                {
                  name: "手机型号（或机型）",
                  condition: "",
                  startValue: "",
                  endValue: "",
                },
              ],
            },
            {
              operator: "and",
              isOpen: true,
              children: [
                {
                  name: "手机价格",
                  condition: "",
                  startValue: "",
                  endValue: "",
                },
                {
                  operator: "and",
                  isOpen: true,
                  children: [
                    {
                      name: "手机颜色",
                      condition: "",
                      startValue: "",
                      endValue: "",
                    },
                    {
                      name: "手机尺寸",
                      condition: "",
                      startValue: "",
                      endValue: "",
                    },
                  ],
                },
              ],
            },
            {
              name: "手机内存",
              condition: "",
              startValue: "",
              endValue: "",
            },
            {
              operator: "and",
              isOpen: true,
              children: [
                {
                  name: "手机网络",
                  condition: "",
                  startValue: "",
                  endValue: "",
                },
                {
                  name: "手机系统",
                  condition: "",
                  startValue: "",
                  endValue: "",
                },
              ],
            },
          ],
        },
      ],
    };
  },
  methods: {
    addCondition() {
      // 情况1
      // []
      if (Array.isArray(this.treeData) && this.treeData.length === 0) {
        this.treeData = [
          {
            name: Date.now(),
            condition: "",
            startValue: "",
            endValue: "",
          },
        ];
      }

      //  情况2
      // [
      //   {
      //     name: "手机内存",
      //     condition: "",
      //     startValue: "",
      //     endValue: "",
      //     }
      // ]
      else if (Array.isArray(this.treeData) && this.treeData.length === 1) {
        this.treeData = [
          {
            operator: "and",
            isOpen: true,
            children: [
              { ...this.treeData[0] }, // 旧内容
            ],
          },
        ];

        const newCondition = {
          name: Date.now(),
          condition: "",
          startValue: "",
          endValue: "",
        };

        this.treeData[0].children.push(newCondition);
      }

      // 情况3
      // [
      //   {
      //     operator: "and",
      //     isOpen: true,
      //     children: [
      //       {
      //         name: "手机网络",
      //         condition: "",
      //         startValue: "",
      //         endValue: "",
      //       },
      //       {
      //         name: "手机系统",
      //         condition: "",
      //         startValue: "",
      //         endValue: "",
      //       },
      //     ],
      //   },
      // ]
      else if (Array.isArray(this.treeData) && this.treeData[0].children.length > 1) {
        const newCondition = {
          name: Date.now(),
          condition: "",
          startValue: "",
          endValue: "",
        };

        this.treeData[0].children.push(newCondition);
      }
    },
  },
};
</script>

<style>
.item-nohover {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 32px;
  z-index: 19;
  transition: opacity 0.3s;
}

.item-nohover::before {
  position: absolute;
  top: -10px;
  left: -10px;
  bottom: -10px;
  right: -10px;
  content: "";
}

.item-nohover:hover > .item-close {
  display: block;
}

.item-nohover.dragging {
  opacity: 0;
}

.item-field {
  min-width: 120px;
  white-space: nowrap;
  z-index: 10;
}

.item-op {
  flex-basis: 8em;
}

.item-value {
  flex: 1 auto;
  min-width: 200px;
}

.item-text {
  /* 留空，以防将来使用 */
}
</style>
