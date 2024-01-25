# 测试

## What 什么是测试

应用程序测试是指检查应用程序运行过程是否正常。

测试的方法主要有两种:手动测试和自动化测试。

- 手动测试是通过测试人员与应用程序的交互操作来检查其是否正常运行的方法。
- 自动化测试是编写测试代码,利用计算机来检查应用程序是否正常运行的方法。简单说，就是利用额外的代码来检查被测软件功能。

自动化测试常分为:单元测试和端到端测试

- 单元测试: 是对应用程序最小单元运行测试的过程。通常，测试的最小单元是**函数**。
  - 优点:
    - 测试运行速度快
    - 有相当于程序文档的功能,帮助新手快速了解功能需求
  - 缺点:
    - 重构代码困难，将一个已经具备完整单元测试的复杂功能拆分为两个单独的功能，需要在更改代码的同时更改相应的单元测试。
    - 只确保单元代码自身行为符合预期，但无法保证各单元之间交互是否正常，这就是为什么需要用到端到端测试的原因。
- 端到端测试: 相当于自动执行的手动测试，从用户的视角通过客户端或模拟浏览器软件自动检查应用程序是否正常工作。
  - 优点:减少人工操作
  - 缺点:
    - 端到端测试运行不够快，因为受限于客户端和网络请求响应时间等
    - 调试困难，比如说需要按打开浏览器逐步按用户操作来重现问题
    - flaky 测试，即使用应用程序正常运行，测试仍然可能频繁失败，可能原因是代码因为某些 API，或请求超时等而导致失败。

> 在前端领域,自动化测试分为三种测试类型,也称为前端测试套件: 单元测试 / 快照测试 / 端到端测试
> 快照测试: 相当于找不同游戏，会给运行中的程序拍一张图片，并将与以前保存的图片进行比较，如果图像不同,则测试失败。

## Why 为什么需要测试

- 快速验证程序功能是否满足需求
- 及时发现程序 bug 进行修复
- 自动化测试能减少人工操作

## How 如何进行测试

在 node 后端应用开发中，单元测试常用测试工具是 Jest，端到端测试使用 supertest。

> node v18 版本以上开始提供了内置的测试模块。基本功能和概念同 Jest 差不多。

### Jest

`Jest` 是一个由 Facebook 开发的测试运行器 (test runner) 。测试运行器就是运行测试代码的程序。

jest 默认能识别哪些是测试文件

- 位于 tests 文件夹下的所有 js 文件
- 文件名以 `test.js` 结尾的文件，譬如 `user.test.js`
- 文件名以 `spec.j`s 结尾的文件，譬如 `user.spec.js`

可以把它们放在任何位置。但我总是把测试文件和接口放在一起，这有利于维护管理。

#### 基本语法

Jest 测试文件默认可以使用 `describe` `it` `expect` 语法，不需要在测试文件内导入 import / required 它们。

- describe 代表一个执行块(作用域)，可以通过`describe`块来将测试用例进行分组，如果没有`describe`，那整个文件就是一个 describe。
- it 声明一个测试用例
- expect 对测试结果进行断言，当所有断言通过时，该测试才会通过

一个基本的测试结构：

```js
// demo.test.js
describe("sanity test", () => {
  it("Testing Jest works", () => {
    expect(1).toBe(1)
  })
})
```

#### 钩子函数

钩子函数主要用于编写初始化代码，有两种：

1. 全局钩子，在配置文件中定义

- setupFiles
- setupFilesAfterEnv
- clearMocks
- resetMocks
- resetModules
- restoreMocks

2. 测试文件内钩子，包括：

- beforeAll
- afterAll
- beforeEach
- afterEach

默认情况下，before 和 after 的块可以应用到文件中的每个测试。当 before 和 after 的块在 describe 块内部时，则其只适用于该 describe 块内的测试。

#### mock 函数

Jest 中的三个与 Mock 函数相关的 API,分别是`jest.fn()`,`jest.spyOn()`,`jest.mock()`。

- `jest.fn()`是创建 Mock 函数最简单的方式,如果没有定义函数内部的实现，`jest.fn`会返回`undefined`作为返回值。也可以设置返回值，或者定义内部实现或返回 Promise 对象。
- `jest.mock()` 用于模拟整个模块，比如测试函数中依赖了其它模块中方法，但测试时并不需要实际引用该模块中方法进行测试，此时可以使用`jest.mock`模拟。
- `jest.spyOn()` 该方法同样创建一个 mock 函数，但是该 mock 函数不仅能够捕获函数的调用情况，还可以正常的执行被监听的函数。实际上，jest.spyOn 是 jest.fn 的语法糖，它创建了一个和被监控的函数具有相同内部代码的 mock 函数。

示例见 [jest mock function](https://jestjs.io/zh-Hans/docs/mock-functions)

#### 常用的断言

- toBe()----等于具体的值
- toEqual()----等于对象
- toBeCalled()----函数被调用
- toHaveBeenCalledTimes()----函数被调用的次数
- toHaveBeenCalledWith()----函数被调用时的参数
- toBeNull()----结果是 null
- toBeUndefined()----结果是 undefined
- toBeDefined()----结果是 defined
- toBeTruthy()----结果是 true
- toBeFalsy()----结果是 false
- toContain()----数组匹配,检查是否包含
- toMatch()----匹配字符型规则,支持正则
- toBeCloseTo()----浮点数
- toThrow()----支持错误消息文本匹配、正则匹配，以及错误类的匹配
- toMatchSnapshot()----jest 特有的快照测试
- .not.toBe()----前面加上.not 就是否定形式

> 注意，异常错误断言，必须将代码包装在函数中，否则不会捕获错误，并且断言将失败。
> `expect(() => throwErrorFn()).toThrow(CustomError)`

#### jest 与 EsModule 的配置

如果项目中开启了 es module 语法。比如 package.json 中配置了 `type: module`时，因为 jest 目前版本对 Node 中的 es module 的支持还是实验性的。所以在启动命令时，添加部分参数：

```json
"type": "module",
"scripts": {
  "test": "node --experimental-vm-modules ../../node_modules/jest/bin/jest.js"
},
```

#### jest 指定测试某个测试文件

一般项目中将 jest 局部安装在项目内，然后通过 package.json 中的 script 配置运行命令 `"test": "jest"`。

如果在开发过程中需要临时测试单个文件，可以使用如下命令：

```sh
# jest 全局安装
jest -- bar.spec.js

# jest 局部安装
./node_module/jest/bin/jest.js -- bar.spec.js
```

不必输入测试文件的完整路径，后面的参数被解释为正则表达式，唯一能标识文件的完整路径的任何部分都足够了。

### supertest

supertest 可以用来测试接口，模拟测试客户端发起请求，然后断言请求响应结果，达到端到端测试的目的。

[SuperAgent 中文使用指南(v3.8.0)](https://juejin.cn/post/6844903552859504654?from=search-suggest#heading-0)

```js
import request from "supertest"
import app from "./app.js"

// 回调的写法
describe("POST /users", function () {
  it("responds with json", function (done) {
    request(app)
      .post("/users")
      .send({ name: "john" })
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err)
        return done()
      })
  })
})

// promise 的写法
describe("GET /users", function () {
  it("responds with json", function () {
    return request(app)
      .get("/users")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200)
      .then((response) => {
        expect(response.body.email).toEqual("foo@bar.com")
      })
  })
})

// async / await 的写法
describe("GET /users", function () {
  it("responds with json", async function () {
    const response = await request(app)
      .get("/users")
      .set("Accept", "application/json")

    expect(response.headers["Content-Type"]).toMatch(/json/)
    expect(response.status).toEqual(200)
    expect(response.body.email).toEqual("foo@bar.com")
  })
})
```

## 测试相关概念

### 测试驱动开发 TDD

测试驱动开发(TDD)是一种在编写源代码之前先编写测试代码的工作流程。

**红/绿/重构**是一种很流行的 TDD 方法。红代表编写一个不能通过的测试，然后修改代码让测试通过变绿，最后通过重构增强代码可读性。

严苛遵守 TDD(在编写源代码之前编写好所有的测试代码)会严重减缓开发速度，所以只要编写可节省时间的，有价值的测试代码就可以，编写先后顺序无关紧要。

### 100% 代码覆盖率是谬误

代码覆盖率是度量自动化测试运行代码库代码行数的一个指标.

- 100% 代码覆盖率意味着执行测试期间每行代码都会被运行
- 0% 代码覆盖率意味着未执行任何代码

不必执着于让应用程序实现 100% 代码覆盖率，它会让你像拧干湿毛巾的最后一滴水一样辛苦，只需要完成应用的核心功能测试即可。

### 可用性测试(sanity test)

搭建测试系统的第一步是编写一个简单的测试来检查测试系统是否正常运行，这个测试用例就称为可用性测试(sanity test)。

## 配置文件 jest.config.js

```js
module.exports = {
  /*****************************************************************
   * 测试环境
   ****************************************************************/
  // The test environment that will be used for testing
  // 用于测试的测试环境。Jest中的默认环境是通过 jsdom 实现的类似于浏览器的环境。如果你正在构建node服务，则可以使用 'node' 值设置类 node 环境
  testEnvironment: 'jsdom',

  // Options that will be passed to the testEnvironment
  // 传递给testEnvironment的选项
  testEnvironmentOptions: {},

  // This option sets the URL for the jsdom environment. It is reflected in properties such as location.href
  // 此选项设置jsdom环境的URL。
  testURL: "http://localhost",

  // Adds a location field to test results
  testLocationInResults: false,

  /*****************************************************************
   * 模块路径解析
   *****************************************************************/
  // The root directory that Jest should scan for tests and modules within
  // Jest应该扫描其中的测试和模块的根目录
  // 在任何其他属性中基于路径的配置设置中使用'<rootDir>'作为字符串令牌将返回此值。
  rootDir: '/',

  // A list of paths to directories that Jest should use to search for files in
  // Jest应该用来在其中搜索文件的目录的路径列表
  // 默认情况下，根只有一个条目<rootDir>，但在某些情况下，您希望在一个项目中有多个根，例如根:["<rootDir>/src/"， "<rootDir>/tests/"]。
  roots: [
    "<rootDir>"
  ],

  // Run tests from one or more projects
  // 从一个或多个项目运行测试, 当为项目配置提供一组路径或glob模式时，Jest将同时在所有指定项目中运行测试。这对于一个人或者同时从事多个项目的时候是很好的。
  // projects: undefined,
  "projects": [
    "<rootDir>/packages/*",
    "<rootDir>/examples/*"
  ]

  // An array of directory names to be searched recursively up from the requiring module's location
  // 指定需要从所需模块的位置上递归搜索的目录名数组。
  // 设置此选项将覆盖默认值，如果你希望仍然在node_modules中搜索包，请将它和其他选项一起包含:["node_modules"， "bower_components"]
  moduleDirectories: [
    "node_modules"
  ],

  // An array of file extensions your modules use
  // 指定 jest 可匹配的文件扩展名。当引入的模块文件没有指定文件扩展名，那么Jest将从这里逐个寻找这些扩展名。类似 webpack 的 resolve.extensions 配置
  moduleFileExtensions: [
    "js",
    "json",
    "jsx",
    "ts",
    "tsx",
    "vue"
  ],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  // 从正则表达式到模块名称的映射, 类似 webpack 中的 resolve.alias, 然后在测试文件中 xxx.spec.js 中可以使用 @ 去映射路径
  // moduleNameMapper: {},
  moduleNameMapper: {'^@/(.*)$': '<rootDir>/src/$1',},

  // An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
  // 设置一个忽略匹配文件的正则字符串数组。
  // 这些路径对模块加载器来说是“可见的”。但如果给定模块的路径与设置值匹配，那么在测试环境中它将不能被 require()。
  modulePathIgnorePatterns: [],

  // The glob patterns Jest uses to detect test files
  // 匹配需要执行的测试文件
  // 默认情况下，它会在__tests__文件夹中查找.js和.jsx文件，以及任何后缀为.test或.spec的文件
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  // 该测试路径下匹配的测试文件将被跳过
  testPathIgnorePatterns: [
    "\\\\node_modules\\\\"
  ],

  // The regexp pattern or array of patterns that Jest uses to detect test files
  // 同 testMatch 属性，不可以两个属性同时设置
  testRegex: [],

  // The directory where Jest should store its cached dependency information
  // Jest用来储存依赖信息缓存的目录。
  // Jest 尝试去扫描你的依赖树一次（前期）并且把依赖树缓存起来，其目的就是抹去某些在运行测试时需要进行的文件系统排序。
  // 这一配置选项让你可以自定义Jest将缓存数据储存在磁盘的哪个位置。
  cacheDirectory: "C:\\Users\\xutao29099\\AppData\\Local\\Temp\\jest",

  /*****************************************************************
   * 测试覆盖率相关配置项 coverage
   ****************************************************************/

  // Indicates whether the coverage information should be collected while executing the test
  // 指定是否收集测试时的覆盖率信息。
  // 由于要带上覆盖率搜集语句重新访问所有执行过的文件，这可能会让你的测试执行速度被明显减慢。
  // 所以 run-script 中可以配置两个命令：test:unit: 'jest' 和 test:coverage: 'jest --coverage'
  collectCoverage: false,

  // Indicates which provider should be used to instrument code for coverage
  // 指定应该使用哪个程序来检测代码的覆盖率
  coverageProvider: 'v8',

  // The directory where Jest should output its coverage files
  // 指定 Jest 输出覆盖信息文件的目录。以下设置会在根目录创建 coverage 目录用于存入覆盖率统计文件
  coverageDirectory: 'coverage',

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  // 可以用一个 glob 的通配模式 的数组来指出仅哪些文件需要云收集覆盖率信息。
  // 如果一个文件匹配上指定的模式，即使没有关于它的测试用例存在，或也没有任何测试用例依赖它，它的覆盖率信息也将被收集。
  // 该选项要求 collectCoverage 被设成true，或者通过 --coverage 参数来调用 Jest。
  // collectCoverageFrom: undefined,
  collectCoverageFrom : ["src/**/*.{js,jsx}", "!**/node_modules/**", "!**/vendor/**"]

  // An array of regexp pattern strings used to skip coverage collection
  // 使用regexp模式字符串数组，指定用于跳过覆盖率收集的目录，默认是跳过 node_modules
  // coveragePathIgnorePatterns: ["\\\\node_modules\\\\"],
  coveragePathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/build/", ],

  // Force coverage collection from ignored files using an array of glob patterns
  // 使用一组glob模式从被忽略的文件强制收集覆盖率
  forceCoverageMatch: [],

  // A list of reporter names that Jest uses when writing coverage reports
  // 指定覆盖率报告输出的文件类型
  coverageReporters: [
    "json",
    "text",
    "lcov",
    "clover"
  ],

  // An object that configures minimum threshold enforcement for coverage results
  // 为覆盖率设置最小阈值的配置对象，如果不满足阈值，jest 将返回失败。
  // 当指定为正数时，阈值被认为是所需的最小百分比。例如：`statements: 90` 意味着语句覆盖率最小是90%
  // 当一个阈值被指定为负数时，它表示允许的未覆盖实体的最大数量。例如：`statements: -10` 表示不允许超过10个未覆盖的语句。
  // 阈值可以指定为全局、仅路径、或全局和路径同时存在。
  // 如果globs或路径与global一起指定，匹配路径的覆盖数据将从整体覆盖中减去，阈值将独立应用。对所有匹配glob的文件应用globs的阈值。如果没有找到path指定的文件，将返回错误。
  // 如下示例全局分支 50% 的覆盖率将应用除 "./src/components/**/*.js" 和 "./src/api/very-important-module.js" 以外的所有 collectCoverageFrom 指定的被测试文件
  // coverageThreshold: undefined,
  coverageThreshold: {
    "global": {
      "branches": 50, // if 语句分支
      "functions": 50,
      "lines": 50,
      "statements": 50
    },
    "./src/components/**/*.js": {
      "branches": 40,
      "statements": 40
    },
    "./src/api/very-important-module.js": {
      "branches": 100,
      "functions": 100,
      "lines": 100,
      "statements": 100
    }
  }

  /****************************************************
   * 自定义相关处理器
   ******************************************************/
  // Allows you to use a custom runner instead of Jest's default test runner
  // 允许您使用自定义运行器，而不是Jest的默认测试运行器 jest-runner
  runner: "jest-runner",

  // This option allows use of a custom test runner
  testRunner: "jasmine2",

  // A path to a custom resolver
  // 自定义路径解析器
  resolver: undefined,

  // This option allows the use of a custom results processor
  // 此选项允许使用自定义结果处理程序
  testResultsProcessor: undefined,

  // Use this configuration option to add custom reporters to Jest
  reporters: undefined,

  // A map from regular expressions to paths to transformers
  // 设置文件预处理器，用于转换源文件为jest环境可用的文件类型或语法
  transform: undefined,

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  // 设置不需要被 transform 转换器处理的文件路径
  transformIgnorePatterns: [
    "\\\\node_modules\\\\",
    "\\.pnp\\.[^\\\\]+$"
  ],

  // A list of paths to snapshot serializer modules Jest should use for snapshot testing
  // 用于快照测试的快照序列化器模块的路径列表
  // snapshotSerializers: [],
  snapshotSerializers: [ 'jest-serializer-vue' ],

  // A path to a custom dependency extractor
  // 自定义依赖项提取器的路径
  dependencyExtractor: undefined,

  // A preset that is used as a base for Jest's configuration
  // 用作 Jest 配置的一个预设插件，例如 preset: '@vue/cli-plugin-unit-jest',
  preset: undefined,

  /*********************************************************
   * 全局调用设置
   *********************************************************/
  // A path to a module which exports an async function that is triggered once before all test suites
  // 指定一个模块的路径，该模块导出在所有测试套件之前触发一次的异步函数（return async fn 或 new Promise())
  globalSetup: undefined,

  // A path to a module which exports an async function that is triggered once after all test suites
  // 指定一个模块的路径，该模块导出在所有测试套件之后触发一次的异步函数（return async fn 或 new Promise())
  globalTeardown: undefined,

  // A set of global variables that need to be available in all test environments
  // 设置一组可以在所有测试环境中可用的全局变量
  // 如果你在这指定了一个全局引用值（例如，对象或者数组），之后在测试运行中有些代码改变了这个被引用的值，这个改动对于其他测试不会生效。
  globals: {},
  // globals: {"__DEV__": true},

  // The maximum amount of workers used to run your tests. Can be specified as % or a number. E.g. maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum worker number. maxWorkers: 2 will use a maximum of 2 workers.
  // 用于运行测试的最大工作程序数量。可以指定为百分比 % 或一个数字。
  // maxWorkers: 10% 将使用你的CPU数量的10% + 1 作为最大worker数。
  // maxWorkers: 2 将使用最多2个 worker 线路。
  maxWorkers: "50%",

  // The paths to modules that run some code to configure or set up the testing environment before each test
  // 每个测试文件都会构建一个测试上下文，并对其上下文环境进行一次处理,行下面配置文件的代码来设置每个测试环境的上下文
  // 这段代码将在setupFilesAfterEnv之前执行。
  // setupTestFrameworkScriptFile 已废弃，用 setupFilesAfterEnv 代替
  setupFiles: [],

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  // 配置文件列表，这些文件运行一些代码来在每次测试之前配置或设置测试框架
  setupFilesAfterEnv: [],

  // The number of seconds after which a test is considered as slow and reported as such in the results.
  slowTestThreshold: 5,

  // All imported modules in your tests should be mocked automatically
  // 设为 true 时，测试文件中所有导入的模块都被自动模拟。但类似 fs 这样的 Node 核心模块，默认是不模拟的，如果需要可以使用 `jest.mock('fs')` 显式指定模拟
  // 开启自动模拟会有一些性消耗，在一些大型工程会更明显。
  // 建议使用默认值 false, 然后通过使用 jest.mock(moduleName) 把项目中的被测模块文件显式的指定为模拟。
  automock: false,

  // Automatically clear mock calls and instances between every test
  // 自动清除每个测试之间的模拟调用和实例
  // 等价于在每个测试之间调用jest.clearAllMocks()。这不会删除可能已经提供的任何模拟实现。
  clearMocks: true,

  // Automatically reset mock state between every test
  // 自动重置每个测试之间的模拟状态
  resetMocks: false,

  // Reset the module registry before running each individual test
  // 在运行每个单独的测试之前，重新设置模块注册表
  resetModules: false,

  // Automatically restore mock state between every test
  // 自动恢复每个测试之间的模拟状态
  restoreMocks: false,

  // Stop running tests after `n` failures
  // 默认值 0，Jest 会运行所有的测试用例，然后产出所有的错误到控制台中直至结束。
  // bail 配置选项可以让 Jest 在遇到第几个失败后就停止继续运行测试用例。
  bail: 0,

  // Setting this value to "fake" allows the use of fake timers for functions such as "setTimeout"
  // 将此值设置为"fake"允许对"setTimeout"等函数使用假计时器
  // 当一段代码设置了我们不希望在测试中等待的长超时时，假计时器是有用的。
  timers: "real",

  // Make calling deprecated APIs throw helpful error messages
  // 设置当调用废弃的 api 时是否抛出有用的错误消息
  errorOnDeprecated: false,

  // Activates notifications for test results
  // 激活测试结果的通知。
  notify: false,

  // An enum that specifies notification mode. Requires { notify: true }
  // 指定通知模式的枚举。要求{notify: true}
  notifyMode: "failure-change",

  // An array of regexp pattern strings that are matched against all modules before the module loader will automatically return a mock for them
  unmockedModulePathPatterns: undefined,

  // Indicates whether each individual test should be reported during the run
  // 多于一个测试文件运行时展示每个测试用例测试通过情况 Boolean
  verbose: undefined,

  // An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode
  // 当 jest 运行在 watch 监视模式下，如果测试文件更改了，会触发重新运行测试。但该属性项匹配的路径中文件如果发生变化，不会触发重新运行测试
  watchPathIgnorePatterns: [],

  // Whether to use watchman for file crawling
  // 是否使用cwatchman 抓取文件
  watchman: true,
}
```
