import * as React from "react";
import gql from "graphql-tag";
import Loading from "../Loading";
import { ApolloClient, ApolloQueryResult } from "apollo-boost";
import { Query, QueryResult } from "react-apollo";
import ConfigCodeEditor from "./ConfigCodeEditor";
import { ValidationResult } from "./codemirror-yaml/mode";
import {
  ConfigCodeEditorContainerQuery,
  ConfigCodeEditorContainerQuery_pipelineOrError_Pipeline_types
} from "./types/ConfigCodeEditorContainerQuery";
import {
  ConfigCodeEditorContainerCheckConfigQuery,
  ConfigCodeEditorContainerCheckConfigQueryVariables
} from "./types/ConfigCodeEditorContainerCheckConfigQuery";

interface IConfigCodeEditorContainerProps {
  pipelineName: string;
  environmentTypeName: string;
  configCode: string;
  onConfigChange: (newValue: string) => void;
}

export default class ConfigCodeEditorContainer extends React.PureComponent<
  IConfigCodeEditorContainerProps
> {
  render() {
    return (
      <Query
        query={CONFIG_CODE_EDITOR_CONTAINER_QUERY}
        variables={{
          pipelineName: this.props.pipelineName
        }}
      >
        {(
          queryResult: QueryResult<
            ConfigCodeEditorContainerQuery,
            { pipelineName: string }
          >
        ) => {
          return (
            <Loading queryResult={queryResult}>
              {data => {
                if (data.pipelineOrError.__typename === "Pipeline") {
                  const typeConfig = createTypeConfig(
                    data.pipelineOrError.types,
                    this.props.environmentTypeName
                  );
                  return (
                    <ConfigCodeEditor
                      typeConfig={typeConfig}
                      checkConfig={json =>
                        checkConfig(
                          queryResult.client,
                          this.props.pipelineName,
                          json
                        )
                      }
                      configCode={this.props.configCode}
                      onConfigChange={this.props.onConfigChange}
                    />
                  );
                } else {
                  return null;
                }
              }}
            </Loading>
          );
        }}
      </Query>
    );
  }
}

export const CONFIG_CODE_EDITOR_CONTAINER_QUERY = gql`
  query ConfigCodeEditorContainerQuery($pipelineName: String!) {
    pipelineOrError(name: $pipelineName) {
      __typename
      ... on Pipeline {
        types {
          __typename
          name
          ... on CompositeType {
            fields {
              name
              type {
                name
              }
            }
          }
        }
      }
    }
  }
`;

function createTypeConfig(
  types: Array<ConfigCodeEditorContainerQuery_pipelineOrError_Pipeline_types>,
  environmentTypeName: string
): {
  environment: Array<{ name: string; typeName: string }>;
  types: {
    [name: string]: Array<{
      name: string;
      typeName: string;
    }>;
  };
} {
  const typeMap = {};
  for (const type of types) {
    if (type.__typename === "CompositeType") {
      typeMap[type.name] = type.fields.map(({ name, type }) => ({
        name,
        typeName: type.name
      }));
    }
  }
  return {
    environment: typeMap[environmentTypeName] || [],
    types: typeMap
  };
}

export const CONFIG_CODE_EDITOR_CONTAINER_CHECK_CONFIG_QUERY = gql`
  query ConfigCodeEditorContainerCheckConfigQuery(
    $executionParams: PipelineExecutionParams!
  ) {
    isPipelineConfigValid(executionParams: $executionParams) {
      __typename

      ... on PipelineConfigValidationInvalid {
        errors {
          reason
          message
          stack {
            entries {
              __typename
              ... on EvaluationStackPathEntry {
                field {
                  name
                }
              }
              ... on EvaluationStackListItemEntry {
                listIndex
              }
            }
          }
        }
      }
    }
  }
`;

async function checkConfig(
  client: ApolloClient<any>,
  pipelineName: string,
  config: any
): Promise<ValidationResult> {
  if (config === null) {
    return { isValid: true };
  }
  const {
    data: { isPipelineConfigValid }
  } = await client.query<
    ConfigCodeEditorContainerCheckConfigQuery,
    ConfigCodeEditorContainerCheckConfigQueryVariables
  >({
    query: CONFIG_CODE_EDITOR_CONTAINER_CHECK_CONFIG_QUERY,
    variables: {
      executionParams: {
        pipelineName: pipelineName,
        config: config
      }
    },
    fetchPolicy: "no-cache"
  });

  if (isPipelineConfigValid.__typename !== "PipelineConfigValidationInvalid") {
    return { isValid: true };
  }

  const errors = isPipelineConfigValid.errors.map(
    ({ message, reason, stack }) => ({
      message: message,
      reason: reason,
      path: stack.entries.map(
        entry =>
          entry.__typename === "EvaluationStackPathEntry"
            ? entry.field.name
            : `${entry.listIndex}`
      )
    })
  );

  // Errors at the top level have no stack path because they are not within any
  // dicts. To avoid highlighting the entire editor, associate them with the first
  // element of the top dict.
  const topLevelKey = Object.keys(config);
  errors.forEach(error => {
    if (error.path.length === 0 && topLevelKey.length) {
      error.path = [topLevelKey[0]];
    }
  });

  return { isValid: false, errors: errors };
}
