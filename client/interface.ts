export interface GraphqlKitConfig {
  /** your qiufen service port */
  port: number
  /** backend service config */
  endpoint: ServiceConfig
  /** request headers */
  requestHeaders?: Record<string, string>
  /** local graphql schema file path */
  localSchemaFile?: string
  /** use either local schema or remote schema, if unset, remote will be used */
  schemaPolicy?: SchemaPolicy
  /** mock config */
  mock?: MockConfig
  openGrouped?: boolean
}

interface ServiceConfig {
  /** backend service url */
  url: string
}

interface MockConfig {
  /** Whether all operations are mocking --> default-value: true */
  openAllOperationsMocking?: boolean
  /** value map rules, you should add all your scalar type mappers here or you'll get an error */
  scalarMap: any
  /** graphql resolvers for operations, you can custom operation response here */
  resolvers?: any
  operations?: NeededMockingOperations
}

type NeededMockingOperations = {
  query: string[]
  mutation: string[]
  subscription: string[]
}

type SchemaPolicy = 'local' | 'remote'
