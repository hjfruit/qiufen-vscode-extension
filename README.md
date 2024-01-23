## graphql-qiufen-pro

![graphql-qiufen-pro-docs](https://z1.ax1x.com/2023/09/19/pP42g8x.png)

### Features
- graphql doc
- Gqls modification is supported synchronously
- Support graphql schema diff
- Support operations field selection
- To be added...

### qiufen.config.js
```js
// eslint-disable-next-line  @typescript-eslint/no-require-imports
const Mock = require('mockjs')

const { Random } = Mock

module.exports = {
  port: 5632,
  // Local schema file path
  localSchemaFile: './src/graphql/generated/schema.graphql',
  // "remote" | "local". When the remote gateway  fails, you are advised to set it to "local" and specify the path of the local schema file.
  schemaPolicy: 'remote',
  endpoint: {
    url: 'http://demo-address/graphql',
  },
  requestHeaders: {
    /** token */
    authorization:
      '++mcE48DJOpTMK1/+',
  },
  openGrouped: true,
  mock: {
    /** Whether all operations are mocking --> default-value: true */
    openAllOperationsMocking: false,
    /** operation-based need mocking */
    operations: {
      query: [],
      mutation: [],
      subscription: [],
    },
    /** mocks */
    scalarMap: {
      Int: () => Random.integer(0, 100),
      String: () => Random.ctitle(2, 4),
      ID: () => Random.id(),
      Boolean: () => Random.boolean(),
      BigDecimal: () => Random.integer(0, 1000000),
      Float: () => Random.float(0, 100),
      Date: () => Random.date(),
      DateTime: () => Random.datetime(),
      Long: () => Random.integer(0, 10000),
      NumberOrBoolOrStringOrNull: () => null,
      NumberOrString: () => null,
      Object: () => ({}),
    },
    resolvers: {
      Query: {
        /* Custom field interface return */
        // ListTaskBoardName: () => {
        //   return [
        //     {
        //       commodityNa3me: "111111111",
        //       commoditySpec2OptionName: "争11232131231212果",
        //       commodityType4Name: "样情",
        //       completedQuan4tity: "府委产",
        //       create4By: "火传离那",
        //     },
        //   ]
        // },
      },
    },
  },
}

```