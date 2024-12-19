# query-builder

### 使用方式

1. 安装依赖
```bash
pnpm add @mypandora/query-builder
```

2. 引入组件
```vue
<!-- 引入组件与样式 -->
import QueryBuilder from '@mypandora/query-builder';
import '@mypandora/query-builder/style.css';

export default {
  name: 'Demo',
  components: {
    QueryBuilder,
  }
  ...
}
```

3. 在 template 中使用
```html
<template>
  <div id="app">
    <query-builder :data.sync="treeData" :operatorText="operatorText">
      <!-- 使用插槽添加自定义查询内容 -->
      <!-- data 为当前数据；onUpdate 为更新数据方法，第一个参数为 key，第二个参数为 value -->
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
```




### 数据格式

#### tree 数据，必填
```js
[
    {
        // 组数据结构: operator: 操作符 isOpen: 是否展开 children: 子节点
        operator: "or",
        isOpen: true,
        children: [
        {
            operator: "and",
            isOpen: true,
            children: [
            {
                // 插槽内容数据结构，请按你的插槽内容组织
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
        ],
    },
]
```

#### operatorText 操作符配置，默认为“且”和“或”，可选

```js
{
    and: "且",
    or: "或",
}
```
