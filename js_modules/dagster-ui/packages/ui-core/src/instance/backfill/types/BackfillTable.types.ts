// Generated GraphQL types, do not edit manually.

import * as Types from '../../../graphql/types';

export type BackfillTableFragment = {
  __typename: 'PartitionBackfill';
  id: string;
  status: Types.BulkActionStatus;
  isAssetBackfill: boolean;
  isValidSerialization: boolean;
  partitionNames: Array<string> | null;
  numPartitions: number | null;
  timestamp: number;
  partitionSetName: string | null;
  hasCancelPermission: boolean;
  hasResumePermission: boolean;
  numCancelable: number;
  partitionSet: {
    __typename: 'PartitionSet';
    id: string;
    name: string;
    pipelineName: string;
    mode: string;
    repositoryOrigin: {
      __typename: 'RepositoryOrigin';
      repositoryName: string;
      repositoryLocationName: string;
      id: string;
    };
  } | null;
  assetSelection: Array<{__typename: 'AssetKey'; path: Array<string>}> | null;
  error: {
    __typename: 'PythonError';
    message: string;
    stack: Array<string>;
    errorChain: Array<{
      __typename: 'ErrorChainLink';
      isExplicitLink: boolean;
      error: {__typename: 'PythonError'; message: string; stack: Array<string>};
    }>;
  } | null;
};

export type PartitionSetForBackfillTableFragment = {
  __typename: 'PartitionSet';
  id: string;
  name: string;
  mode: string;
  pipelineName: string;
  repositoryOrigin: {
    __typename: 'RepositoryOrigin';
    id: string;
    repositoryName: string;
    repositoryLocationName: string;
  };
};
