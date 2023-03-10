import { ApolloServer } from "@apollo/server"
import { addMocksToSchema } from "@graphql-tools/mock"
import { makeExecutableSchema } from "@graphql-tools/schema"
import { expressMiddleware } from "@apollo/server/express4"
import cors from "cors"
import { json } from "body-parser"
import express from "express"
import path from "path"
import fetchRemoteSchemaTypeDefs from "@/utils/fetchRemoteSchemaTypeDefs"
import { buildSchema } from "graphql"
import { getOperationsBySchema } from "../src/utils/operation"

export async function startServer(config: GraphqlKitConfig) {
  const { endpoint, port, mock } = config

  const app = express()

  const backendTypeDefs = await fetchRemoteSchemaTypeDefs(endpoint.url)

  const server = new ApolloServer({
    schema: addMocksToSchema({
      schema: makeExecutableSchema({ typeDefs: backendTypeDefs }),
      mocks: mock?.scalarMap,
    }),
  })

  await server.start()
  app.use("/graphql", cors<cors.CorsRequest>(), json(), expressMiddleware(server))

  app.get("/operations", async (req, res) => {
    const schema = buildSchema(backendTypeDefs)
    const operations = getOperationsBySchema(schema)
    res.send(operations)
  })

  app.use(express.static(path.resolve(__dirname, "../dist-page-view")))

  const expressServer = app.listen(port, () => {
    console.log(`Server listening on port http://localhost:${port}/graphql`)
  })

  return expressServer
}