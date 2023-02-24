import { readFileSync, existsSync } from "fs"
import * as vscode from "vscode"
import express from "express"
import bodyParser from "body-parser"
import chalk from "chalk"
import { buildSchema } from "graphql"
import { stitchSchemas } from "@graphql-tools/stitch"
import createGraphqlController from "./graphqlController"
import createPlaygroundController from "./playgroundController"
import getIPAddress from "./utils/getIPAddress"
import type { GraphqlKitConfig, MockConfig } from "./interface"
import type { Server } from "http"
import createOperationsController from "./operations"
import path from "path"
import fetchRemoteSchemaTypeDefs from "@/utils/fetchRemoteSchemaTypeDefs"

interface LoadSchemaOptions {
  schemaPolicy?: GraphqlKitConfig["schemaPolicy"]
  endpointUrl: GraphqlKitConfig["endpoint"]["url"]
  localSchemaFile?: GraphqlKitConfig["localSchemaFile"]
  mockSchemaFiles?: MockConfig["schemaFiles"]
}

/**
 * get BuildSchema
 * @param options - options
 */
async function getGraphQLSchema({ schemaPolicy, endpointUrl, localSchemaFile = "", mockSchemaFiles = [] }: LoadSchemaOptions) {
  let backendSchema
  switch (schemaPolicy) {
    case undefined:
    case "remote":
      let backendTypeDefs
      try {
        backendTypeDefs = await fetchRemoteSchemaTypeDefs(endpointUrl)
      } catch (err) {
        throw err
      }
      backendSchema = buildSchema(backendTypeDefs)
      break
    case "local":
      if (!localSchemaFile) {
        throw new Error("there is no localSchemaFile option, you should set it in your config file")
      } else if (!existsSync(localSchemaFile)) {
        throw new Error(`${localSchemaFile} is not exist`)
      } else {
        backendSchema = buildSchema(
          readFileSync(localSchemaFile, {
            encoding: "utf-8",
          })
        )
      }
      break
    default:
      vscode.window.showErrorMessage(`unknown schemaPolicy ${schemaPolicy}`)
      throw new Error("error!!!")
  }

  return stitchSchemas({
    mergeDirectives: true,
    typeDefs: [
      `
      directive @mock(enable: Boolean, val: NumberOrBoolOrStringOrNull, len: NumberOrString, fallback: Boolean, err: GraphqlError) on FIELD | QUERY | MUTATION
      input GraphqlError {
        code: Int!
        message: String!
      }
      scalar NumberOrBoolOrStringOrNull
      scalar NumberOrString
    `,
    ],
    subschemas: [
      { schema: backendSchema },
      ...mockSchemaFiles.map((file, index) => {
        try {
          if (!file) {
            throw new Error(`schemaFiles[${index}] is not valid`)
          } else if (!existsSync(file)) {
            throw new Error(`schemaFiles[${index}] ${file} is not exist`)
          } else {
            const mockSchema = buildSchema(
              readFileSync(file, {
                encoding: "utf-8",
              })
            )
            return {
              schema: mockSchema,
            }
          }
        } catch (err) {
          // eslint-disable-next-line no-throw-literal
          throw err as Error
        }
      }),
    ],
  })
}

/**
 * start graphql server
 * @param configPath - the absolute path of config file
 */
const startServer = (config: GraphqlKitConfig): Promise<Server> => {
  return new Promise(async (resolve, reject) => {
    try {
      const app = express()
      const ip = getIPAddress() || "0.0.0.0"
      const port = config.port

      app.all("*", (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Methods", "*")
        res.header("Access-Control-Allow-Credentials", "true")
        res.header("Access-Control-Allow-Headers", "authorization")
        next()
      })

      app.use(bodyParser.json())

      const { endpoint, schemaPolicy, localSchemaFile, mock } = config
      const getRawSchema = async () => {
        try {
          const schema = await getGraphQLSchema({
            schemaPolicy,
            localSchemaFile,
            endpointUrl: endpoint.url,
            mockSchemaFiles: mock?.schemaFiles,
          })
          return schema
        } catch (err) {
          throw err
        }
      }

      const rawSchema = await getRawSchema()
      const graphqlController = await createGraphqlController(config, rawSchema)
      app.use(graphqlController)

      const playgroundController = createPlaygroundController(rawSchema, config, ip)
      app.use(playgroundController)

      const operationsController = createOperationsController()
      app.use(operationsController)

      app.use(express.static(path.resolve(__dirname, "../dist-page-view")))

      const server = app.listen(port, "0.0.0.0")
      resolve(server)
    } catch (err) {
      reject(err)
    }
  })
}

export { startServer, getGraphQLSchema }