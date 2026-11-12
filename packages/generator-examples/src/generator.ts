import type { ApiModel, Generator, MediaContent, Operation } from "@abitech/openchasqui-spec";
import { type DataSet, ExampleBuilder } from "./values.js";

export const examplesGenerator: Generator = {
  name: "@abitech/openchasqui-generator-examples",
  kind: "generator",
  apiVersion: 1,
  generate: async (model, context) => {
    const data: DataSet = context.options.data === "es-pe" ? "es-pe" : "generic";
    return { ...model, operations: model.operations.map((op) => withExamples(model, op, data)) };
  },
};

/** Fills only what the contract leaves empty; declared examples stay. */
function withExamples(model: ApiModel, operation: Operation, data: DataSet): Operation {
  const builder = new ExampleBuilder(model, data, `${operation.method} ${operation.path}`);
  const parameters = operation.parameters.map((parameter) =>
    parameter.example === undefined
      ? { ...parameter, example: builder.value(parameter.name, parameter.schema) }
      : parameter,
  );
  if (!operation.requestBody) {
    return { ...operation, parameters };
  }
  const content = operation.requestBody.content.map(
    (media): MediaContent =>
      media.example === undefined && media.mediaType.includes("json")
        ? { ...media, example: builder.value("body", media.schema) }
        : media,
  );
  return { ...operation, parameters, requestBody: { ...operation.requestBody, content } };
}
