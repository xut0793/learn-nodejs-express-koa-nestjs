# GraphQL 类型系统

[graphql.js 链接](https://graphql.org/graphql-js/graphql/#graphql)
[以下示例仓库 gitee](https://gitee.com/xut0793/learn-graphql)

## 入口 graphql

```ts
graphql(
  schema: GraphQLSchema, // 服务端可执行的类型定义 schema
  requestString: string, // 客户端查询的数据定义 schema
  rootValue?: ?any, // 将作为根值传递给执行器
  contextValue?: ?any, // 上下文对象，将传递给所有解析器函数
  variableValues?: ?{[key: string]: any}, // 参数变量，将传给所有解析器函数
  operationName?: ?string // 如果 requestString 中包含多个操作，需在此处批量当前执行哪个操作
): Promise<GraphQLResult>
```

## Schema

这里对 Schema 的说法，包含两部分：

- 服务端定义 schema: GraphQLSchema
- 客户端查询入参 schema，即 requestString

### GraphQLSchema

```ts
class GraphQLSchema {
  constructor(config: GraphQLSchemaConfig)
}

type GraphQLSchemaConfig = {
  description?: string
  query?: GraphQLObjectType
  mutation?: GraphQLObjectType
  subscription?: GraphQLObjectType
  types?: ReadonlyArray<GraphQLNamedType>
  directives?: ReadonlyArray<GraphQLDirective>
}

type GraphQLNamedType =
  | GraphQLScalarType
  | GraphQLEnumType
  | GraphQLInputObjectType
  | GraphQLObjectType
  | GraphQLInterfaceType
  | GraphQLUnionType
```

例子

```js
const schema = new GraphQLSchema({
  query queryRootType,
  mutation: mutationRootType,
  types: [UserType],
  directives: specifiedDirectives.concat(uppercaseDirective),
})
```

### 客户端 requestString

一个符合 GraphQL 语法结构的字符串

```js
const requestString = `
  query user($userId: String!, $withUserList: Boolean!) {
    total
    user(id: $userId) {
      id
      name
    }
    userList @include(if: $withUserList) {
      id
      name
    }
  }
`
```

## 类型定义 Type Definitions

### GraphQLScalarType 内置标量类型

GraphQL 自带一组默认标量类型：

- Int：有符号 32 位整数。
- Float：有符号双精度浮点值。
- String：UTF‐8 字符序列。
- Boolean：true 或者 false。
- ID：ID 标量类型表示一个唯一标识符，通常用以重新获取对象或者作为缓存中的键。ID 类型使用和 String 一样的方式序列化；然而将其定义为 ID 意味着并不需要人类可读型。

```sh
# 在对象实例化（constructing Type）试构建 schema 时不需要实例化，直接使用。它们都是 GraphQLScalarType 的实例
GraphQLInt
GraphQLFloat
GraphQLString
GraphQLBoolean
GraphQLID
```

### GraphQLScalarType 自定义标量类型

```ts
class GraphQLScalarType<InternalType> {
  constructor(config: GraphQLScalarTypeConfig<InternalType>)
}

type GraphQLScalarTypeConfig<InternalType> = {
  name: string
  description?: ?string
  serialize: (value: mixed) => ?InternalType
  parseValue?: (value: mixed) => ?InternalType
  parseLiteral?: (valueAST: Value) => ?InternalType
}
```

例子

```js
const DateTimeType = new GraphQLScalarType({
  name: "DateTime",
  description: "A valid date time value",
  serialize: (value) => new Date(value).toISOString(), // 响应到客户端 json 时的序列化函数
  parseValue: (value) => new Date(value), // 客户端查询时变量参数传入的值进行转化
  parseLiteral: (ast) => ast.value, // 客户端查询时直接添加在 schema 时传入
}),
```

GraphQL 数据模型定义有两种形式：

- schema type 模式，通常由社区的库实现，比如借助 @graphql-tools/schema，如果有自定义指令还要借助 @graphql-tools/utils
- constructing type 构造器模式，原生实现

- constructing type

```js
const UserType = new GraphQLObjectType({
  name: "User",
  description: '用户类型定义',
  fields: {
    id: {type: new GraphQLNonNUll(GraphQLInt)},
    name: {type: new GraphQLNonNull(GraphQLString)}
    created: {type: DateTimeType}
  }
})
const schema = new GraphQLSchema({
  types: [DateTimeType, UserType],
  query: new GraphQLObjectType({
    name: 'queryRootType',
    fields: () => ({
      user: {
        type: UserType,
        description: "根据用户id，查询单个用户",
        args: {
          id: {
            description: "id of the user",
            type: new GraphQLNonNull(GraphQLInt),
          },
        },
        resolve: (source, args, context, info) => {
          return users.find((u) => u.id === args.id)
        },
      }
    })
  }),
})
```

- schema type

```js
const typeDefs = `
scalar DateTime
type User {
  id: Int!
  name: String!
  created: DateTime!
}
type Query {
  user(id: Int!): User
}
`
const resolvers = {
  DateTime: DateTimeType,
  Query: {
    user: (parent, { id }) => {
      return fakeUsers.find((u) => u.id === id)
    },
  },
}
```

### GraphQLObjectType

在 schema 定义中除了用标量类型定义叶子节点外，几乎所有要定义的字段类型都会是 Object 类型。

```ts
class GraphQLObjectType {
  constructor(config: GraphQLObjectTypeConfig)
}

type GraphQLObjectTypeConfig = {
  name: string
  description?: ?string
  fields: GraphQLFieldConfigMapThunk | GraphQLFieldConfigMap
  interfaces?: GraphQLInterfacesThunk | Array<GraphQLInterfaceType>
  isTypeOf?: (value: any, info?: GraphQLResolveInfo) => boolean
}

type GraphQLInterfacesThunk = () => Array<GraphQLInterfaceType>

type GraphQLFieldConfigMapThunk = () => GraphQLFieldConfigMap

type GraphQLFieldConfigMap = {
  [fieldName: string]: GraphQLFieldConfig
}

type GraphQLFieldConfig = {
  type: GraphQLOutputType
  args?: GraphQLFieldConfigArgumentMap
  resolve?: GraphQLFieldResolveFn
  deprecationReason?: string
  description?: ?string
}

type GraphQLFieldConfigArgumentMap = {
  [argName: string]: GraphQLArgumentConfig
}

type GraphQLArgumentConfig = {
  type: GraphQLInputType
  defaultValue?: any
  description?: ?string
}

// 关于解析器函数，请参见下文
type GraphQLFieldResolveFn = (
  source?: any,
  args?: { [argName: string]: any },
  context?: any,
  info?: GraphQLResolveInfo
) => any

type GraphQLResolveInfo = {
  fieldName: string
  fieldNodes: Array<Field>
  returnType: GraphQLOutputType
  parentType: GraphQLCompositeType
  schema: GraphQLSchema
  fragments: { [fragmentName: string]: FragmentDefinition }
  rootValue: any
  operation: OperationDefinition
  variableValues: { [variableName: string]: any }
}
```

示例见上方自定义标量类型的例子。

### GraphQLNonNull

强制其取值不能为 null，在某次请求时如果出现 null 值便会抛出错误。

```ts
class GraphQLNonNull {
  constructor(type: GraphQLType)
}
```

例子

```ts
const UserType = new GraphQLObjectType({
  name: "User",
  description: '用户类型定义',
  fields: {
    id: {type: new GraphQLNonNUll(GraphQLInt)},
    name: {type: new GraphQLNonNull(GraphQLString)}
    created: {type: DateTimeType}
  }
})
```

### GraphQLList

```ts
class GraphQLList {
  constructor(type: GraphQLType)
}
```

例子

```js
// schema type
const typeDefs = `
  type Query {
    userList: [User]
  }
`
// constructing type
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
      userList: {
        type: new GraphQLList(UserType),
        description: "全部用户",
        resolve(source, args, context, info) {
          return users
        },
      },
    },
  }
})
```

### GraphQLEnumType

如果在定义时没有指定 value，在内部使用时会用枚举类型的 name 作为其值。

```ts
class GraphQLEnumType {
  constructor(config: GraphQLEnumTypeConfig)
}

type GraphQLEnumTypeConfig = {
  name: string
  description?: ?string
  values: GraphQLEnumValueConfigMap
}

type GraphQLEnumValueConfigMap = {
  [valueName: string]: GraphQLEnumValueConfig
}

type GraphQLEnumValueConfig = {
  value?: any
  description?: ?string
  deprecationReason?: string
}
```

例子

```ts
var RoleType = new GraphQLEnumType({
  name: "Role",
  values: {
    FATHER: { value: 0, description: "父亲" },
    MOTHER: { value: 1, description: "母亲" },
    SON: { value: 2, description: "儿子" },
    DAUGHTER: { value: 3, description: "女儿" },
  },
})
```

### GraphQLInputObjectType

```ts
class GraphQLInputObjectType {
  constructor(config: GraphQLInputObjectConfig)
}

type GraphQLInputObjectConfig = {
  name: string
  description?: ?string
  fields:
    | GraphQLInputObjectConfigFieldMapThunk
    | GraphQLInputObjectConfigFieldMap
}

type GraphQLInputObjectConfigFieldMapThunk =
  () => GraphQLInputObjectConfigFieldMap

type GraphQLInputObjectConfigFieldMap = {
  [fieldName: string]: GraphQLInputObjectFieldConfig
}

type GraphQLInputObjectFieldConfig = {
  type: GraphQLInputType
  defaultValue?: any
  description?: ?string
}
```

上面有一个通过用户 id 查询用户信息的例子

```graphql
type Query {
  user(id: Int!): User
}
```

这里形参是一个 id 参数。假设用户有更多信息: 性别、爱好等字段，然后需要通过名称和性别同时检索。
我们可能会输入多个参数，写成这样

```graphql
enum Gender {
  Male
  Female
}
type Query {
  user(name: String!, gender: Gender): User
}
```

如果有更多参数，不想一直单列出来输入，此时可以将查询参数组成一个对象结构作为形参。

```graphql
enum Gender {
  Male
  Female
}
input QueryUserInput {
  name: String!
  gender: Gender = Gender.Male
}
type Query {
  user(params: QueryUserInput): User
}
```

在客户端查询的形参中也同样定义

```ts
const query = `
query getUser($params: QueryUserInput)  {
  user(params: $params) {
    id
    name
    gender
  }
}
`
```

如果是用 constructing type 方式来定义

```js
var GenderType = new GraphQLEnumType({
  name: "Gender",
  values: {
    Male: { value: "Male", description: "男性" },
    Female: { value: "Female", description: "女性" },
  },
})
const QueryUserInput = new GraphQLInputObjectType({
  name: "QueryUserInput",
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString), description: "用户名称" },
    gender: { type: GenderType, defaultValue: "Male", description: "用户性别" },
  }),
})

const schema = new GraphQLSchema({
  types: [DateTimeType, UserType, GenderType, QueryUserInput],
  query: new GraphQLObjectType({
    name: "queryRootType",
    fields: () => ({
      user: {
        type: UserType,
        description: "根据用户信息，查询单个用户",
        args: {
          params: {
            type: QueryUserInput,
          },
        },
        resolve: (source, args, context, info) => {
          const { name, gender } = args.params
          return users.find((u) => u.name === name && u.gender === gender)
        },
      },
    }),
  }),
})
```

### GraphQLInterfaceType

一个接口是一个抽象类型，它声明某些字段，然后当某个对象类型实现它时，必须包含这些字段。

当一个字段可能返回多种不同类型时，可使用接口类型 GraphQLInterfaceType，来描述所有可能类型必须有的共同字段，也可指定 resolveType 函数来决定该字段实际被解析时为何种类型。

```ts
class GraphQLInterfaceType {
  constructor(config: GraphQLInterfaceTypeConfig)
}

type GraphQLInterfaceTypeConfig = {
  name: string
  fields: GraphQLFieldConfigMapThunk | GraphQLFieldConfigMap
  resolveType?: (value: any, info?: GraphQLResolveInfo) => ?GraphQLObjectType
  description?: ?string
}
```

假设抽象一个书本的类型，包含 title，然后有两种类型的书，纯文字书和彩绘书本，额外增加了对应的字段。

```js
// schema type
const typeDefs = `
  interface Book {
    title: String!
  }

  type TextBook implements Book {
    title: String!
    author: String!
  }

  type ColoringBook implements Book {
    title: String!
    color: String!
  }

  type Query {
    books: [Book!]!
  }
`
const resolvers = {
  Query: {
    books: (parent, args, contextValue, info) => {
      return fakeBooks
    },
  },
  Book: {
    __resolveType: (book, contextValue, info) => {
      if (book instanceof TextBook) {
        return "TextBook"
      }
      if (book instanceof ColoringBook) {
        return "ColoringBook"
      }
      return null
    },
  },
}
```

另一种服务端实现 construction type

```ts
// construction type
const BookInterface = new GraphQLInterfaceType({
  name: 'Book',
  fields: () => ({
    title: {type: new GraphQLNonNull(GraphQLString), description: '用户名称'}
  })
  resolveType: (book, contextValue, info) => {
    if (book instanceof TextBook) {
      return 'TextBook';
    }
    if (book instanceof ColoringBook) {
      return 'ColoringBook';
    }
    return null
  }
})

const TextBook = new GraphQLObjectType({
  name: 'TextBook',
  interfaces: [BookInterface],
  fields: () => ({
    title: {type: new GraphQLNonNull(GraphQLString), description: '用户名称'},
    author: {type: new GraphQLNonNull(GraphQLString), description: '作者'}
  })
})

const ColoringBook = new GraphQLObjectType({
  name: 'ColoringBook',
  interfaces: [BookInterface],
  fields: () => ({
    title: {type: new GraphQLNonNull(GraphQLString), description: '用户名称'},
    color: {type: new GraphQLNonNull(GraphQLString), description: '颜色'}
  })
})

const schema = new GraphQLSchema({
  types: [BookInterface, TextBook, ColoringBook],
  query: new GraphQLObjectType({
    name: 'queryRootType',
    fields: () => ({
      books: {
        type: new GraphQLList(BookInterface),
        resolve: (source, args, context, info) => {
          return fakeBooks
        },
      }
    })
  }),
})
```

查询所有书本，Query.books 返回一个列表，该列表可以同时包含 Textbooks 和 ColoringBooks。

此时，客户端实现查询时，如果只需要返回共同字段 title 时，那构建查询比较简单。

```js
const query = `query getBooks {
  books {
    title
  }
}`
```

但如果还想返回 textBook 或者 coloringBook 中的字段时，需要配合内联版段 inline fragments 来构建查询结果

```js
const query = `query getBooks {
  books {
    __typename
    title
    ...on TextBook {
      author
    }
    ...on ColoringBook {
      color
    }
  }
}`
```

返回的结果如下：

```json
{
  "data": {
    "books": [
      {
        "__typename": "TextBook",
        "title": "Wheelock's Latin",
        "author": "Latin I"
      },
      {
        "__typename": "ColoringBook",
        "title": "Oops All Water",
        "color": "Blue"
      }
    ]
  }
}
```

> **typename
> 每个对象类型都会自动具有一个名为 **typename 的字段，不用在 schema 中定义，它会以字符串形式返回当前字段类型的名称。
> 它用于多种目的，例如确定可以返回多种类型（即联合或接口）的字段返回了哪种类型。某些客户端，如 Apollo Client 在缓存结果时依赖于 **typename，因此它会自动在每个查询的每个对象中包含**typename。所以类似内置字段可以在构建客户端查询时声明，这样响应结果会包含该字段值。

### GraphQLUnionType

联合类型和接口十分相似，但是它并不指定类型之间的任何共同字段，相反，它联合了多个对象的所有字段。

使用联合类型 GraphQLUnionType 描述所有可能类型，也可指定 resolveType 函数来决定该字段实际被解析时为何种类型。

联合类型的成员需要是具体对象类型；你不能使用接口或者其他联合类型来创造一个联合类型。

```ts
class GraphQLUnionType {
  constructor(config: GraphQLUnionTypeConfig)
}

type GraphQLUnionTypeConfig = {
  name: string
  types: GraphQLObjectsThunk | Array<GraphQLObjectType>
  resolveType?: (value: any, info?: GraphQLResolveInfo) => ?GraphQLObjectType
  description?: ?string
}

type GraphQLObjectsThunk = () => Array<GraphQLObjectType>
```

```ts
//  schema type

const typeDefs = `
  type Book {
    title: String!
  }

  type Author {
    name: String!
  }

  union SearchResult = Book | Author

  type Query {
    search(type: String): [SearchResult!]
  }
`

const resolvers = {
  Query: {
    search: (parent, args, contextValue, info) => {
      return args.type === 'book' ? fakeBook : args.type === 'author' ? fakeAuthor : null
    }
  }
  SearchResult: {
    __resolveType: (obj, contextValue, info) => {
      if (obj instanceof Book) {
        return 'Book';
      }
      if (obj instanceof Author) {
        return 'Author';
      }
      return null
    }
  }
}
```

另一种服务端实现 construction type

```ts
// construction type
const Book = new GraphQLObjectType({
  name: "Book",
  fields: () => ({
    title: { type: new GraphQLNonNull(GraphQLString) },
  }),
})
const Author = new GraphQLObjectType({
  name: "Author",
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
  }),
})
const SearchResultUnion = new GraphQLUnionType({
  name: "SearchResultUnion",
  types: [Book, Author],
  resolveType(obj, conetxtValue, info) {
    if (obj instanceof Book) {
      return "Book"
    }
    if (obj instanceof Author) {
      return "Author"
    }
    return null
  },
})

const schema = new GraphQLSchema({
  types: [Book, Author, SearchResultUnion],
  query: new GraphQLObjectType({
    name: "queryRootType",
    fields: () => ({
      search: {
        type: SearchResultUnion,
        args: {
          type: {
            type: GraphQLString,
          },
        },
        resolve: (source, args, context, info) => {
          return args.type === "book"
            ? fakeBook
            : args.type === "author"
              ? fakeAuthor
              : null
        },
      },
    }),
  }),
})
```

此时客户端查询的时候，可能不知道将返回哪种对象类型，实际返回会根据动态传入的实参决定。所以在定义查询时，需要用到内联版段 inline fragments 来包含可能的多种类型中的字段。

```js
const query = `
  query getSearchResults($possibleTypes: String!) {
    search(type: $possibleTypes) {
      __typename
      ...on Book {
        title
      }
      ...on Author {
        name
      }
    }
  }
`
```

查询后可能返回的数据结构如下

```json5
{
  "data": {
    "search": [
      {
        "__typename": "Book",
        "title": "The Complete Works of William Shakespeare"
      }
    ]
  }
}

// 或者
{
  "data": {
    "search": [
      {
        "__typename": "Author",
        "name": "William Shakespeare"
      }
    ]
  }
}
```

## GraphQLDirective

指令的作用是提供了一种方式，可以用来修改或裁剪客户端定义查询 schema 时的字段。

比如如我们假设有个 UI 组件，其有概括视图和详情视图，后者比前者拥有更多的字段，但又想通过同一个查询来返回。此时则可以通过查询参数和指令一起来解决。

```graphql
query getUserInfo($userId: String!, $withFriends: Boolean!) {
  user(id: $userId) {
    name
    friends @include(if: $withFriends) {
      name
    }
  }
}
```

如果查询时提供了变量 withFriends 的值为 true 时，则会连用户的朋友信息一起返回，否则没不返回。

### 内置指令

GraphQL 的核心规范包含几个内置指令，其在任何规范兼容的 GraphQL 服务器实现所支持：

- @include(if: Boolean!) 仅在参数为 true 时，包含此字段，作用于 FIELD / FRAGMENT_SPREAD / INLINE_FRAGMENT。
- @skip(if: Boolean!) 如果参数为 true，跳过此字段, 作用于 FIELD / FRAGMENT_SPREAD / INLINE_FRAGMENT。
- @defer(if: Boolean!, label: String) 如果参数为真 true 时，延迟 label 指定名称的片段, 作用于 FRAGMENT_SPREAD / INLINE_FRAGMENT
- @stream(if: Boolean! = true, label: String, initialCount: Int = 0) 流式传输，作用于 FIELD
- @deprecated(reason: String = 'No longer supported') 标识当前字段已废弃，作用于 FIELD_DEFINITION / ARGUMENT_DEFINITION / INPUT_FIELD_DEFINITION / ENUM_VALUE
- @specifiedBy(url: String!) 为标量字段指定一个说明链接，作用于 SCALAR
- @oneOf() 指示输入对象中必须提供一个字段，并且该字段不能为“null”。 作用于 INPUT_OBJECT

指令定义时需要指定其作用的位置，比如部分指令只限于客户端查询结构中的固定位置，有些是服务端定义 schema 时的固定位置。具体见下面接口定义。

通过 graphql.js 提供的 api 来获取所有内置指令 specifiedDirectives 和判断是不是内置指令 isSpecifiedDirective

```js
import { specifiedDirectives, isSpecifiedDirective } from "graphql.js"
```

### 自定义指令

```ts
class GraphQLDirective {
  constructor(config: GraphQLDirectiveConfig)
}

type GraphQLDirectiveConfig = {
  name: string
  description?: string
  args?: GraphQLFieldConfigArgumentMap
  locations: ReadonlyArray<DirectiveLocation>
  isRepeatable?: boolean // 是否可以在同一字段上多次使用
}

type GraphQLFieldConfigArgumentMap = ObjMap<GraphQLArgumentConfig>
interface GraphQLArgumentConfig {
  description?: Maybe<string>
  type: GraphQLInputType
  defaultValue?: unknown
}

enum DirectiveLocation {
  /** Request Definitions 应用于客户端查询 schema */
  QUERY = "QUERY",
  MUTATION = "MUTATION",
  SUBSCRIPTION = "SUBSCRIPTION",
  FIELD = "FIELD",
  FRAGMENT_DEFINITION = "FRAGMENT_DEFINITION",
  FRAGMENT_SPREAD = "FRAGMENT_SPREAD",
  INLINE_FRAGMENT = "INLINE_FRAGMENT",
  VARIABLE_DEFINITION = "VARIABLE_DEFINITION",
  /** Type System Definitions 服务端定义 schema */
  SCHEMA = "SCHEMA",
  SCALAR = "SCALAR",
  OBJECT = "OBJECT",
  FIELD_DEFINITION = "FIELD_DEFINITION",
  ARGUMENT_DEFINITION = "ARGUMENT_DEFINITION",
  INTERFACE = "INTERFACE",
  UNION = "UNION",
  ENUM = "ENUM",
  ENUM_VALUE = "ENUM_VALUE",
  INPUT_OBJECT = "INPUT_OBJECT",
  INPUT_FIELD_DEFINITION = "INPUT_FIELD_DEFINITION",
}
```

例子：定义一个响应字符串值为大写的指令 uppercase，可以作用于客户端请求的查询字段和参数字段上。

```js
const uppercaseDirective = new GraphQLDirective({
  name: "uppercase",
  description:
    "默认将值全部转化为大写字母，也可以通过参数指定字符串转化的开始和结束位置",
  locations: [DirectiveLocation.FIELD, DirectiveLocation.ARGUMENT_DEFINITION],
  args: {
    start: {
      type: GraphQLInt,
      description: "the start position",
      defaultValue: 0,
    },
    end: {
      type: GraphQLInt,
      description: "the end position",
    },
  },
})
```

此时客户端查询可以这样设置

```graphql
query getUser($userId: String!, $start: Int, $end: Int) {
  user(id: $userId) {
    id
    name @uppercase(start: $start, end: $end)
  }
}
```

然后服务端针对 user.name 字段的 resolver 如何解析呢？

```js
const UserType = new GraphQLObjectType({
  name: "User",
  description: "用户类型定义",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      deprecationReason: "这是一个 id 的 deprecated 的说明",
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      resolve(source, args, context, info) {
        const fieldValue = source.name

        if (typeof fieldValue !== "string") return fieldValue

        const filedDirectives = info.fieldNodes[0].directives
        const uppercaseDirective = filedDirectives.find(
          (d) => d.name.value === "uppercase"
        )

        if (!uppercaseDirective) return fieldValue

        const directiveArgs = uppercaseDirective.arguments
        let [start, end] = directiveArgs.reduce((ret, cur) => {
          if (cur.value.kind === "Variable") {
            // @uppercase(start: $start, end: $end)，此时需要从 variableValues 获取变量的值
            ret.push(info.variableValues[cur.name.value])
          } else {
            // @uppercase(start: 3, end: 5) 此时 cur.value.kind = IntValue
            ret.push(cur.value.value)
          }
          return ret
        }, [])

        if (!start) return fieldValue.toUpperCase()

        if (start < 0) {
          start = 0
        }

        if (!end) {
          end = fieldValue.length
        }

        return (
          fieldValue.slice(0, start) +
          fieldValue.slice(start, end).toUpperCase() +
          fieldValue.slice(end, fieldValue.length)
        )
      },
    },
  },
})
```

最后将 UserType 和 uppercaseDirective 注册到服务端 schema 中。

```js
import { GraphQLSchema,  specifiedDirectives } from "graphql"
const schema = new GraphQLSchema({
  types: [UserType],
  directives: [].concat(specifiedDirectives, uppercaseDirective)  // 注意此时需要将内置指令与自定义指令合并后，赋值 directives 字段，不然会导致内置指令解析报错
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      user: {
        type: UserType,
        args: {
          id: {
            description: "id of the user",
            type: new GraphQLNonNull(GraphQLString),
          },
        },
        resolve: (source, args, context, info) => {
          return users.find((u) => u.id === args.id)
        },
      }
    }
  })
})
```

如果使用 schema type 方式定义，需要借助 graphql-tools.js 包中的辅助函数。

参考链接 [graphql-tools.js](https://github.com/apollographql/docs-examples/blob/main/apollo-server/v4/custom-directives/upper-case-directive/src/index.ts)

```ts
// upper.directives.ts
import { defaultFieldResolver, GraphQLSchema } from "graphql"
import { getDirective, MapperKind, mapSchema } from "@graphql-tools/utils"

export const upperDirectiveTypeDefs = `directive @uppercase(start: Int, end: Int ) on FIELD_DEFINITION`
export const upperDirectiveTransformer = (schema: GraphQLSchema) => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const upperDirective = getDirective(schema, fieldConfig, "uppercase")?.[0]
      if (upperDirective) {
        let { start, end } = upperDirective
        const { resolve = defaultFieldResolver } = fieldConfig
        return {
          ...fieldConfig,
          resolve: async function (source, args, context, info) {
            const result = await resolve(source, args, context, info)
            if (typeof result === "string") {
              if (!start) return result.toUpperCase()

              if (start < 0) {
                start = 0
              }

              if (!end) {
                end = result.length
              }
              return (
                result.slice(0, start) +
                result.slice(start, end).toUpperCase() +
                result.slice(end, result.length)
              )
            }
            return result
          },
        }
      }
    },
  })
}
```

集成到 schema 中。

```js
import { ApolloServer } from "@apollo/server"
import { startStandaloneServer } from "@apollo/server/standalone"
import { makeExecutableSchema } from "@graphql-tools/schema"
import {
  upperDirectiveTypeDefs,
  upperDirectiveTransformer,
} from "./upper.directive.ts"

const typeDefs = `
  type Query {
    hello: String @upper()
  }
`

const resolvers = {
  Query: {
    hello() {
      return "Hello World"
    },
  },
}

let schema = makeExecutableSchema({
  typeDefs: [upperDirectiveTypeDefs, typeDefs],
  resolvers: resolvers,
})

schema = upperDirectiveTransformer(schema)

const server = new ApolloServer({ schema })
const { url } = await startStandaloneServer(server, { listen: { port: 4000 } })
console.log(`🚀 Server listening at: ${url}`)
```

从自定义指令的函数中可以看出，schema type 的方式，最终也是通过工具函数映射到每一个添加了指令的字段，覆盖字段原本的 resolve 函数，增加指令相关的逻辑代码。

## resolver

解析器是一个函数，负责填充 schema 中每个字段的数据。它可以由你自定义的方式填充该数据，例如从后端数据库或第三方 API 获取数据。如果没有提供，将会使用框架内默认的的字段解析函数 defaultFieldResolver。

不管是 constructing type 还是 schema type 方式，可以认为每一个字段都可以定义一个 resolve 函数。

```ts
type GraphQLFieldResolver = (
  // 该字段的父级字段解析函数的返回值
  // 对于没有父级的顶级字段，如 Query 的解析函数，此值为 graphql函数的 rootValue 参数
  source: TSource,
  // 一个对象，包含了查询时传入的 variables 变量对象
  args: TArgs,
  // 所有解析函数共享的上下文对象，由程序初始化时传入。解析函数不应破坏性地修改 contextValue 参数，要确保所有解析器之间的一致性，并防止了意外错误。
  context: TContext,
  // 当前执行状态的信息，包含当前字段解析出的 AST 信息，完整的 schema 对象信息等，具体见 GraphQLResolveInfo 类型定义。
  info: GraphQLResolveInfo
) => unknown

export interface GraphQLResolveInfo {
  readonly fieldName: string
  readonly fieldNodes: ReadonlyArray<FieldNode>
  readonly returnType: GraphQLOutputType
  readonly parentType: GraphQLObjectType
  readonly path: Path
  readonly schema: GraphQLSchema
  readonly fragments: ObjMap<FragmentDefinitionNode>
  readonly rootValue: unknown
  readonly operation: OperationDefinitionNode
  readonly variableValues: { [variable: string]: unknown }
}
```

如果没有提供，将会使用框架内默认的的字段解析函数 defaultFieldResolver，该函数仅从父级对象 source 中返回与当前解析字段同名属性的值。

```ts
export const defaultFieldResolver: GraphQLFieldResolver<unknown, unknown> =
  function (source: any, args, contextValue, info) {
    if (isObjectLike(source) || typeof source === "function") {
      const property = source[info.fieldName]

      if (typeof property === "function") {
        return source[info.fieldName](args, contextValue, info)
      }

      return property
    }
  }
```

## contextValue

在 GraphQL schema 初始化时，您可以通过创建名为 contextValue 的对象或函数，在服务器的解析器和插件之间共享数据。

```js
// graphql.js
graphql({
  schema,
  source,
  // contextValue 可以是对象，函数，或者异步函数
  // contextValue: { token: "Global Token value", db: {} },
  contextValue: async ({ req, params }) => {
    // 这是客户端查询时的入参 params = {operationName, variables, query, extensions}
    const user = await getUserFormReq(req)
    return {
      user,
      req,
    }
  }
  variableValues: {
    userId: "gPlake",
    withUserList: false,
    start: 3,
    end: 5,
  },
})
  .then((res) => {
    console.log(res)
  })
  .catch((err) => console.error(err))
```

@Apollo/server 初始化中注入上下文对象

```js
import { ApolloServer } from "@apollo/server"
import { startStandaloneServer } from "@apollo/server/standalone"

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
})

const app = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, params }) => {
    // 这是客户端查询时的入参 params = {operationName, variables, query, extensions}
    const user = await getUserFormReq(req)
    return {
      user,
      req,
    }
  },
})
console.log(`🚀  Server ready at: ${app.url}`)
```

## 分页

基于传统 RESTfull 架构的方式，使用 pageSize 和 pageNum 的变量来实现分页。

客户端查询定义

```js
const query = `
  query getUsers($pageNum: Int!, $pageSize: Int!) {
    userList(pageNum: $pageNum, pageSize: $pageSize): [User]!
  }
`
const variables = { pageNum: 1, pageSize: 10 }

const url = "http://localhost:4000/graphql"

const options = {
  method: "POST",
  Headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query, variables }),
}

fetch(url, options)
  .then((res) => res.json())
  .then(console.log)
  .catch(console.error)
```

服务端实现

```js
const typeDefs = `
  type Query {
    userList(pageNum: Int!, pageSize: Int!): [User]!
  }
`
const resolvers = {
  Query: {
    userList: (source, args, contextValue, info) => {
      const { pageNum, pageSize } = args
      return fakeGetUserList(pageNum, pageSize)
    },
  },
}
```

## 登录、授权

登录、授权仍然可以和传统 RESTfull 一样，只需要单独在 Mutation 中定义一个字段解析即可。

客户端定义查询

```js
// 客户端请求登录
const query = `
  mutation PostLogin($account: String!, $password: String!) {
    login(account: $account, password: $password): User
  }
`
const variables = { account: "zhangsan", password: "123456" }

const url = "http://localhost:4000/graphql"

const options = {
  method: "POST",
  Headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query, variables }),
}

fetch(url, options)
  .then((res) => res.json())
  .then(console.log)
  .catch(console.error)
```

服务端实现

```js
const typeDefs = `
  type Mutation {
    login(account: String!, password: String!): [User]!
  }
  type User {
    id
    name
    accessToken
  }
`
const resolvers = {
  Mutation: {
    login: (source, args, contextValue, info) => {
      const { account, password } = args
      const user = fakeGetUser(account, password)
      const accessToken = generateToken(user)

      return {
        ...user,
        accountToken,
      }
    },
  },
}
```

## 鉴权

鉴权的主要思路就是：

- 在用户信息放在 contextValue 中，提供给所有解析器。
- 至于在哪里校验用户权限，可以
  - 在 contextValue 中初步校验用户是否存在，不存在返回错误。当然需要过滤掉不需要校验的路由白名单
  - 在每个 resolve 函数中，从 contextValue 对象中拿到用户信息做校验
  - 同样也可以放在数据模型函数中，比如与数据库沟通的 service 函数中
  - 自定义鉴权指令

如果使用 JWT 模式鉴权，客户端每次查询时，将登录返回的 accessToken 放在请求头 Authorization 中。

```js
// 客户端请求登录
const query = `
  query getUser($userId: Int!) {
    user(id: $userId): User
  }
`
const variables = { userId: 1 }

const url = "http://localhost:4000/graphql"

const options = {
  method: "POST",
  Headers: {
    "Content-Type": "application/json",
    Authorization: localStorage.getItem("TOKEN"),
  },
  body: JSON.stringify({ query, variables }),
}

fetch(url, options)
  .then((res) => res.json())
  .then(console.log)
  .catch(console.error)
```

服务端实现

```js
const typeDefs = `
  type Query {
    user(id: Int!): User
  }
  type User {
    id
    name
    accessToken
  }
`
const resolvers = {
  Query: {
    user: (source, args, contextValue, info) {

      // 方式一：在 resolve 函数中，从 contextValue 对象中拿到用户信息做校验
      const user = contextValue.user
      if (!user || !user.roles.includes('ADMIN')) {
        throw new GraphQLError('User is not authenticated', {
        extensions: {
          code: 'UNAUTHENTICATED',
          http: { status: 401 },
        },
      });
      }

      return contextValue.modes.user.findOne(args.id)

      // 方式二：在数据模型中注入用户信息后，内部校验
      return contextValue.modes.user.findOne({id: args.id, loginUser: user})
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const app = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    const contextValue = {
      req,
      db,
    }

    const url = req.url

    if (whiteListUrls.includes(url)) {
      return contextValue
    }

    const token = req.headers.authorization || ''
    const user = await getUser(token)
    // { user: { id: 12345, roles: ['user', 'admin'] } }

    if (!user) {
      throw new GraphQLError('User is not authenticated', {
        extensions: {
          code: 'UNAUTHENTICATED',
          http: { status: 401 },
        },
      });
    }

    return {
      ...contextValue,
      user,
    }
  },
})
console.log(`🚀  Server ready at: ${app.url}`)

```

另一种是自定义一个 @auth 指令校验

```js
// auth.directives.ts
import { defaultFieldResolver, GraphQLSchema } from "graphql"
import { getDirective, MapperKind, mapSchema } from "@graphql-tools/utils"

export const authDirectiveTypeDefs = `
directive @auth(requires: Role = ADMIN) on OBJECT | FIELD_DEFINITION
enum Role {
  ADMIN
  REVIEWER
  USER
}
`
export const authDirectiveTransformer = (schema: GraphQLSchema) => {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, "auth")?.[0]
      if (authDirective) {
        const { requires } = authDirective

        if (requires) {
          const { resolve = defaultFieldResolver } = fieldConfig

          return {
            ...fieldConfig,
            resolve: async function (source, args, context, info) {
              // 方式三：在指令逻辑中校验用户信息
              const user = contextValue.user
              if (!user || !user.roles.some((r) => requires.includes(r))) {
                throw new GraphQLError("User is not authenticated", {
                  extensions: {
                    code: "UNAUTHENTICATED",
                    http: { status: 401 },
                  },
                })
              }
              const result = await resolve(source, args, context, info)
              return result
            },
          }
        } else {
          return fieldConfig
        }
      }
    },
  })
}
```

最后注册指令到 schema 中

```js
import { ApolloServer } from "@apollo/server"
import { startStandaloneServer } from "@apollo/server/standalone"
import { makeExecutableSchema } from "@graphql-tools/schema"
import {
  authDirectiveTypeDefs,
  authDirectiveTransformer,
} from "./auth.directive.ts"

const typeDefs = `
  type User @auth(requires: USER) {
    name: String
    banned: Boolean @auth(requires: ADMIN)
    canPost: Boolean @auth(requires: REVIEWER)
  }
`

const resolvers = {
  Query: {
    user: (source, args, contextValue, info) => {
      return contextValue.modes.user.findOne(args.id)
    },
  },
}

let schema = makeExecutableSchema({
  typeDefs: [authDirectiveTypeDefs, typeDefs],
  resolvers,
})

schema = authDirectiveTransformer(schema)

const server = new ApolloServer({ schema })
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req }) => {
    const contextValue = {
      req,
      db,
    }

    const url = req.url

    if (whiteListUrls.includes(url)) {
      return contextValue
    }

    const token = req.headers.authorization || ""
    const user = await getUser(token)
    // { user: { id: 12345, roles: ['user', 'admin'] } }

    if (!user) {
      throw new GraphQLError("User is not authenticated", {
        extensions: {
          code: "UNAUTHENTICATED",
          http: { status: 401 },
        },
      })
    }

    return {
      ...contextValue,
      user,
    }
  },
})
console.log(`🚀 Server listening at: ${url}`)
```

## 上传文件

从 GraphQL 的 Schema 结构定义来看，天然就是处理 JSON 数据类型的。但在客户端（浏览器）进行文件上传使用的是 File 文件对象，在网络进行传输时是二进制流的格式，如何合并到 JSON 字符串中，天然和 GraphQL 规范不匹配。所以 GraphQL 官方也没有针对文件处理，不管是上传还是下载，没有官方解决方案。

常见的几种上传文件方案：

- 使用 base64 编码文件 File 数据，形成类似字符串的值附加到查询参数的 json 中
- 上传接口使用 RESTfull 形式的 HTTP 方式，与 GraphQL 分离。
- 将图片上传到独立的文件服务器或独立的云上存储，将将文件 uri 返回附加到 GraphQL 查询变量上。
- 坚持在 GraphQL 方案中集成文件上传服务，则需要借助第三方依赖库，常用的客户端(graphql-upload-client)和服务端(graphql-upload)

### RESTful 实现文件上传

回想下 RESTfull 架构中如何进行文件上传的，在常规接口交互约定请求头是 `Content-Type: application/json`，如果涉及文件传输，就需要改变请求头为 `multipart/form-data`。在实现上，需要将请求体转成 formData 对象。

> multipart/form-data 定义在 [rfc2388](https://tools.ietf.org/html/rfc2388) 中，最早的 HTTP POST 是不支持文件上传的，给编程开发带来很多问题。但是在 1995 年，ietf 出台了 rfc1867，也就是《RFC 1867 -Form-based File Upload in HTML》，用以支持文件上传。所以 Content-Type 的类型扩充了 multipart/form-data 用以支持向服务器发送二进制数据。

#### 浏览器端

现代浏览器实现 Fetch 请求时，当请求体 body 是 FormData 对象时，并且 Content-type 请求头未主动设置，为空时，会自动设置请求头类型为 multipart/form-data

```html
// 浏览器上传文件
<input type="file" id="file-input" onchange="upload" />

<script>
  function upload(event) {
    const formData = new FormData()
    formData.append("desc", "xxx")
    formData.append("file", event.target.files[0])
    fetch("/upload", {
      method: "post",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
      })
  }
</script>
```

此时查看网络请求，请求头类型。

```
Content-Type:multipart/form-data; boundary=ZnGpDtePMx0KrHh_G0X99Yef9r8JZsRJSXC
```

请求体数据结构：

```
--ZnGpDtePMx0KrHh_G0X99Yef9r8JZsRJSXC
Content-Disposition: form-data;name="desc"
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit

...desc content
--ZnGpDtePMx0KrHh_G0X99Yef9r8JZsRJSXC
Content-Disposition: form-data;name="pic"; filename="photo.jpg"
Content-Type: application/octet-stream
Content-Transfer-Encoding: binary

... binary data of the jpg ...
--ZnGpDtePMx0KrHh_G0X99Yef9r8JZsRJSXC--
```

可以看出 formDat 里的数据 boundary 和请求头 Content-Type 里的 boundary 是一致的。后端实现数据解析严重依赖 boundary，而这个值是浏览器自行根据文件计算后附加的，所以 Content-Type 请求头最好为空，保持浏览器自动行为，如果是手动设置是无法设置 boundary 的值，服务器也就无法解析请求头数据了。

> apollo-upload-client.js 中实现 createUploadLink 时就会判断是否有设置 Content-Type 请求头，如果有会进行删除 `delete options.headers["content-type"];`

#### 服务器端

使用 Node，来接受前端传来的 form-data 参数，通过 req.body 获取不到，解析为{}空对象，需要使用第三依赖包来解析 multipart/form-data 规范的数据。

```js
const express = require("express")
const multer = require("multer")
const upload = multer({ dest: "assets/pictures/" })

const app = express()
app.post("/profile", upload.single("file"), function (req, res, next) {
  // 通过 multer 中间件处理，此时 req.file 将具有文件数据
  res.send({
    filename: req.file.filename,
  })
})
```

下面是一个解析的原生解析实现，[解析 form-data 数据，实现 formidable 函数的功能](https://www.cnblogs.com/arduka/p/13128809.html)

```js
module.exports = function formParse(body, boundary) {
  //将Buffer类型的数据转化成binary编码格式的字符串
  let formStr = Buffer.concat(body).toString("binary")
  let formarr = formStr.split(boundary)
  //去掉首尾两端的无用字符
  formarr.shift()
  formarr.pop()
  //存储普通key-value
  let filed = {}
  //存储文件信息
  let file = {}
  for (let item of formarr) {
    //去除首尾两端的非信息字符
    item = item.slice(0, -2).trim()
    //value存储input输入的值
    let value = ""
    //不同操作系统换行符不同,用变量a声明特殊分割点位的下标
    let a
    if ((a = item.indexOf("\r\n\r\n")) != -1) {
      value = item.slice(a + 4)
    } else if ((a = item.indexOf("\r\r")) != -1) {
      value = item.slice(a + 2)
    } else if ((a = item.indexOf("\n\n")) != -1) {
      value = item.slice(a + 2)
    }
    //正则匹配，组中内容
    let key = item.match(/name="([^"]+)"/)[1]
    if (item.indexOf("filename") == -1) {
      if (!(key in filed)) {
        //将二进制字符串转化成utf8格式的字符串
        filed[key] = Buffer.from(value, "binary").toString("utf8")
      } else {
        //将复选框的数据放入一个数组中
        let arr = []
        filed[key] = arr.concat(filed[key], value)
      }
    } else {
      let filename_b = item.match(/filename="([^"]*)"/)[1]
      //解决中文文件名乱码的问题
      let filename = Buffer.from(filename_b, "binary").toString()
      let contentType = item.slice(item.indexOf("Content-Type:"), a)
      let obj = {}
      obj.filename = filename
      obj.contentType = contentType
      obj.binaryStream = value //文件的二进制数据
      let arr = []
      if (!(key in file)) {
        arr.push(obj)
        file[key] = arr
      } else {
        //用于多文件上传
        file[key] = arr.concat(file[key], obj)
      }
    }
  }
  return { filed, file }
}
```

```js
router.post("/file", (req, res, next) => {
  //post请求  我这边用的是express router
  req.setEncoding("binary")
  let body = [] // 文件数据
  // 边界字符串
  let boundary = req.headers["content-type"].split("boundary=")[1]

  //接收post如data 流 buffer
  req.on("data", function (chunk) {
    body.push(chunk)
  })

  req.on("end", function () {
    let { field, file } = formParse(body, boundary)
    // 自行处理 file
    return res.end()
  })
})
```

### GraphQL 处理文件上传

目前 GraphQL 官方没有规定类似 multipart/form-data 的数据解析规范，但是有一个通用的社区规范，并且有客户端和服务端的实现库可以使用。

- [GrapqhQL Multipart Request 规范: jaydenseric/graphql-multipart-request-spec](https://github.com/jaydenseric/graphql-multipart-request-spec)
- [客户端实现 jaydenseric/apollo-upload-client](https://github.com/jaydenseric/apollo-upload-client/tree/master) 的作用就是将客户端文件上传的请求体处理成符合规范的样式，形如上面
- [服务端实现 jaydenseric/graphql-upload](https://github.com/jaydenseric/graphql-upload) 的作用在服务端从符合社区规范的请求体中解析出文件流数据

规范中约定，如果是单个文件上传，请求查询定义：

```graphql
{
  query: `
    mutation($file: Upload!) {
      singleUpload(file: $file) {
        id
      }
    }
  `,
  variables: {
    file: File // a.txt
  }
}
```

请求体内容如下格式

```
----cec8e8123c05ba25
Content-Disposition: form-data; name="operations"

{ "query": "mutation ($file: Upload!) { singleUpload(file: $file) { id } }", "variables": { "file": null } }
-----cec8e8123c05ba25
Content-Disposition: form-data; name="map"

{ "0": ["variables.file"] }
-----cec8e8123c05ba25
Content-Disposition: form-data; name="0"; filename="a.txt"
Content-Type: text/plain

Alpha file content.

----cec8e8123c05ba25--
```

在 apollo-upload-client 内部实现时，需要将请求参数进行转换，附加上 map 信息。使用 cURL 请求时类似这样：

```js
curl localhost:3001/graphql \
  -F operations='{ "query": "mutation ($file: Upload!) { singleUpload(file: $file) { id } }", "variables": { "file": null } }' \
  -F map='{ "0": ["test.jpg"] }' \
  -F 0=@a.txt
```

#### 客户端

如果客户端不使用 apollo-upload-client 实现的话，自行实现的话，如下进行 fetch 请求

```html
// 浏览器上传文件
<input type="file" id="file-input" onchange="upload" />

<script>
  function upload(event) {
    const file = event.target.files[0]
    const query = `
      mutation uploadFile($file: Upload!) {
        upload(file: $file) {
          id
        }
      }
    `
    const formData = new FormData()
    formData.append(
      "operations",
      JSON.stringify({ query, variables: { file: null } })
    )
    formData.append("map", JSON.stringify({ 0: [file.filename] }))
    formData.append("0", file)

    fetch("/upload", {
      method: "post",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data)
      })
  }
</script>
```

也可以在 Vue 框架中集成 @apollo/client 和 graphql-upload-client。

```js
import { createApp, provide, h } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { createUploadLink } from 'apollo-upload-client'

// 使用 createUploadLink 实例化客户端 apolloClient
const httpLink = createUploadLink({
  uri: 'http://localhost:4000/graphql',
})
const cache = new InMemoryCache()
const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
})

// 注册到 Vue
const app = createApp({
  setup () {
    provide(DefaultApolloClient, apolloClient)
  },
  render: () => h(App),
})

// 上传组件
<template>
  <input @change="upload" type="file"/>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue"
import { useMutation, useQuery } from "@vue/apollo-composable"
import { gql } from "@apollo/client/core"

const { mutate: upload } = useMutation(
  gql`
    mutation ($file: Upload!) {
      singleUpload(file: $file) {
        id
        name
        url
      }
    }
  `,
  {
    context: {
      hasUpload: true, // 必须指明当前是文件上传，服务端使用 graphql-upload 包解析数据使用
    },
  }
)
</script>
```

#### 服务端实现

graphql-upload 的使用指导不是很清晰，可以看另一个类似的库的 README [graphql-upload-minimal](https://github.com/flash-oss/graphql-upload-minimal/blob/master/README.md)

示例参考 [用 grapqhl-upload 的方式实现文件上传](https://www.cnblogs.com/Asp1rant/p/17418809.html)

```js
import fs from "node:fs"
import { finished } from "stream/promises"
import express from "express"
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import { graphqlUploadExpress, GraphQLUpload } from "graphql-upload"

const typeDefs = `
  # 'GraphQLUpload' export from the 'graphql-upload' package
  scalar Upload

  type File {
    id: String!
    name: String!
    url: String!
  }

  type Mutations {
    singleUpload(file: Upload!): File!
  }

`
const resolvers = {
  // 'GraphQLUpload' export from the 'graphql-upload' package
  Upload: GraphQLUpload,
  Mutation: {
    singleUpload: (source, { file }) => storeUpload(file),
  },
}

async function storeUpload(file) {
  const { createReadStream, filename } = await file // graphql-upload 封装的特殊文件对象
  const stream = createReadStream()
  const storedFilename = `${Date.now()}_${filename}`
  const storedFileUrl = join(UPLOAD_DIRECTORY_URL, storedFilename)

  await new Promise((resolve, reject) => {
    const writeStream = createWriteStream(storedFileUrl)

    writeStream.on("finish", resolve)
    writeStream.on("error", (error) => {
      unlink(storedFileUrl, () => {
        reject(error)
      })
    })
    stream.on("error", (error) => writeStream.destroy(error))
    stream.pipe(writeStream)
  })

  return {
    id: storedFilename,
    name: filename,
    url: storedFileUrl,
  }
}

const app = express()
const httpServer = http.createServer(app)

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  csrfPrevention: false, // 默认 true, 此时需要客户端请求带上相关请求 x-apollo-operation-name 或 apollo-require-preflight
})
await server.start()

// 集成 RESTfull 和 GraphQL一起o
app.get("/", (req, res) => res.end("Welcome to the photoShare GraphQL API"))
app.use(
  "/graphql",
  graphqlUploadExpress({
    // 这里对上传文件进行条件限制
    // 并且限制条件应该比其它网络节点更严格，比如 nginx 节点等，这样错误才能通过 graphql-upload 处理。
    maxFileSize: 10000000, // 10 MB
    maxFiles: 20,
  }),
  express.json(), // 必要
  expressMiddleware(server, {
    context: async ({ req }) => {
      return { req }
    },
  })
)

// 启动服务
await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve))
console.log(`🚀 Server ready at http://localhost:4000`)
```

## 下载文件

因为下载文件同样涉及到文件流格式，所以同上传文件一样，GraphQL 本身不支持直接下载文件。

所以以下几种实践方案：

- 返回下载 url，在 GraphQL 服务端返回第三方云存储或本地存储文件的下载地址，然后将该 URL 返回给客户端。客户端可以使用该 URL 下载文件。
- 当 RESTful 和 GraphQL 共存时，使用 RESTful API 直接下载文件，但这与 GraphQL 不太相关。

## subscription 订阅

GraphQL 的查询和变更通过 HTTP 实现，但是因为订阅需要客户端和服务端双向通信，所以需要使用 WebSocket 实现。

Apollo server 4 使用 graphql-ws 实现开箱即用的 GraphQL 订阅功能，参考实现链接 [GraphQL Subscription](https://www.apollographql.com/docs/apollo-server/data/subscriptions/)。

> 之前的 graphql-subscriptions graphql-transports-ws 已经弃用

```sh
npm install ws graphql-ws @graphql-tools/schema
```

服务端示例

```js
import { createServer } from "http"
import { WebSocketServer } from "ws"
import express from "express"
import cors from "cors"
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import { makeExecutableSchema } from "@graphql-tools/schema"
import { useServer } from "graphql-ws/lib/use/ws"
// import resolvers from './resolvers';
// import typeDefs from './typeDefs';

const typeDefs = `
  type Subscription {
    hello: String
    postCreated: Post
  }
  type Post {
    author: String!
    comment: String
  }
`
// 查询和变更使用 resolve 解析函数，订阅使用 subscribe 订阅字段来解析
const resolvers = {
  Subscription: {
    hello: {
      // Example using an async generator
      subscribe: async function* () {
        for await (const word of ["Hello", "Bonjour", "Ciao"]) {
          yield { hello: word }
        }
      },
    },
    postCreated: {
      // More on pubsub below
      subscribe: () => pubsub.asyncIterator(["POST_CREATED"]),
    },
  },
  // ...other resolvers...
}

const schema = makeExecutableSchema({ typeDefs, resolvers })

const app = express()
const httpServer = createServer(app)

const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/subscriptions",
})
const serverCleanup = useServer({ schema }, wsServer)

const server = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose()
          },
        }
      },
    },
  ],
})

await server.start()
app.use("/graphql", cors(), express.json(), expressMiddleware(server))

const PORT = 4000
httpServer.listen(PORT, () => {
  console.log(`Server is now running on http://localhost:${PORT}/graphql`)
})
```

客户端实现，参考 [Vue Apollo Subscriptions](https://apollo.vuejs.org/zh-cn/guide-composable/subscription.html)

```sh
npm install graphql-ws @vue/apollo-composable @apollo/client/core
```

```js
import { HttpLink, split } from "@apollo/client/core"
import { WebSocketLink } from "@apollo/client/link/ws"
import { getMainDefinition } from "@apollo/client/utilities"

// 创建一个 http 连接：
const httpLink = new HttpLink({
  uri: "http://localhost:3000/graphql",
})

// 创建一个 WebSocket 连接：
const wsLink = new WebSocketLink({
  uri: `ws://localhost:5000/`,
  options: {
    reconnect: true,
  },
})

// 使用拆分连接的功能，你可以根据要发送的操作类型将数据发送到每个连接
const link = split(
  // 根据操作类型拆分
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    )
  },
  wsLink,
  httpLink
)

// 注册到 Vue
const app = createApp({
  setup() {
    provide(DefaultApolloClient, apolloClient)
  },
  render: () => h(App),
})
```

组件内使用

```vue
<script>
import { watch, ref } from "vue"
import { useSubscription } from "@vue/apollo-composable"

export default {
  setup() {
    const messages = ref([])

    const { result } = useSubscription(gql`
      subscription onPostCreated {
        postCreated {
          author
          comment
        }
      }
    `)

    watch(
      result,
      (data) => {
        messages.value.push(data)
      },
      {
        lazy: true, // 不要立即执行处理程序
      }
    )

    return {
      messages,
    }
  },
}
</script>

<template>
  <div>
    <ul>
      <li v-for="(message, index) of messages" :key="index">
        {{ message.author }}: {{ message.comment }}
      </li>
    </ul>
  </div>
</template>
```

在很多情况下，在允许客户端接收订阅结果之前，有必要对客户端进行身份验证。为此 SubscriptionClient 构造函数接受一个 connectionParams 字段，该字段传递一个自定义对象，服务端可以在设置任何订阅之前使用该对象来验证连接。

```js
import { WebSocketLink } from "@apollo/client/link/ws"

const wsLink = new WebSocketLink({
  uri: `ws://localhost:5000/`,
  options: {
    reconnect: true,
    connectionParams: {
        authToken: localStorage.getItem('TOKEN'),
    },
})
```
