export interface GraphqlKitConfig {
  /** your qiufen service port */
  port: number
  /** backend service config */
  endpoint: ServiceConfig
  /** local graphql schema file path */
  localSchemaFile?: string
  /** use either local schema or remote schema, if unset, remote will be used */
  schemaPolicy?: SchemaPolicy
  /** mock config */
  mock?: MockConfig
}
interface ServiceConfig {
  /** backend service url */
  url: string
}
interface MockConfig {
  /** value map rules, you should add all your scalar type mappers here or you'll get an error */
  scalarMap: any
  /** graphql resolvers for operations, you can custom operation response here */
  resolvers?: any
}
type SchemaPolicy = 'local' | 'remote'
interface PlaygroundConfig {
  /** request headers */
  headers?: Record<string, string>
}
