import { Suspense, useMemo, useState } from 'react';
import {
  ActionFunctionArgs,
  Form,
  useActionData,
  useLoaderData,
  useRevalidator,
} from 'react-router-dom';
import { useInterval } from 'react-use';
import { toast } from 'sonner';
import {
  Button,
  CircleSpinner,
  createColumnHelper,
  Select,
  SelectItem,
  Table,
  TableSkeleton,
} from 'ui-components';

import { getDiagnosisApiClient } from '@/api/api';
import {
  ApiDocsBadRequestResponse,
  DiagnosisDiagnosticLogsLink,
  DiagnosisGetDiagnosticLogsResponse,
  DiagnosisNodeIdentifierNodeTypeEnum,
} from '@/api/generated';
import { DFLink } from '@/components/DFLink';
import { useGetClustersList } from '@/features/common/data-component/searchClustersApiLoader';
import { useGetHostsList } from '@/features/common/data-component/searchHostsApiLoader';
import { SettingsTab } from '@/features/settings/components/SettingsTab';
import { ApiError, makeRequest } from '@/utils/api';
import { formatMilliseconds } from '@/utils/date';
import { typedDefer, TypedDeferredData } from '@/utils/router';
import { DFAwait } from '@/utils/suspense';

type LoaderDataType = {
  message?: string;
  data?: DiagnosisGetDiagnosticLogsResponse;
};
const getDiagnosticLogs = async (): Promise<LoaderDataType> => {
  const diagnosticLogsPromise = await makeRequest({
    apiFunction: getDiagnosisApiClient().getDiagnosticLogs,
    apiArgs: [],
  });

  if (ApiError.isApiError(diagnosticLogsPromise)) {
    return {
      message: 'Error in getting diagnostic logs',
    };
  }

  return {
    data: diagnosticLogsPromise,
  };
};

const loader = async (): Promise<TypedDeferredData<LoaderDataType>> => {
  return typedDefer({
    data: getDiagnosticLogs(),
  });
};

const ACTION_TYPE = {
  CONSOLE_LOGS: 'consoleLogs',
  AGENT_LOGS: 'agentLogs',
};

const action = async ({ request }: ActionFunctionArgs): Promise<string | null> => {
  const formData = await request.formData();
  const nodeIds = formData.getAll('nodeIds[]') as string[];
  const clusterIds = formData.getAll('clusterIds[]') as string[];
  const actionType = formData.getAll('actionType')?.toString();

  if (
    actionType === ACTION_TYPE.AGENT_LOGS &&
    nodeIds.length === 0 &&
    clusterIds.length === 0
  ) {
    return 'Please select at least one host/cluster';
  }
  if (!actionType) {
    return 'You have not triggered any action';
  }
  let result = null;
  if (actionType === ACTION_TYPE.AGENT_LOGS) {
    const _hosts = nodeIds.map((node) => {
      return {
        node_id: node,
        node_type: DiagnosisNodeIdentifierNodeTypeEnum.Host,
      };
    });

    const _clusters = clusterIds.map((cluster) => {
      return {
        node_id: cluster,
        node_type: DiagnosisNodeIdentifierNodeTypeEnum.Cluster,
      };
    });

    result = await makeRequest({
      apiFunction: getDiagnosisApiClient().generateAgentDiagnosticLogs,
      apiArgs: [
        {
          diagnosisGenerateAgentDiagnosticLogsRequest: {
            node_ids: [..._hosts, ..._clusters],
            tail: 10000,
          },
        },
      ],
      errorHandler: async (r) => {
        const error = new ApiError<{
          message?: string;
        }>({});
        if (r.status === 400 || r.status === 409) {
          const modelResponse: ApiDocsBadRequestResponse = await r.json();
          return error.set({
            message: modelResponse.message ?? '',
          });
        }
      },
    });
  } else if (actionType === ACTION_TYPE.CONSOLE_LOGS) {
    result = await makeRequest({
      apiFunction: getDiagnosisApiClient().generateConsoleDiagnosticLogs,
      apiArgs: [
        {
          diagnosisGenerateConsoleDiagnosticLogsRequest: {
            tail: 10000,
          },
        },
      ],
      errorHandler: async (r) => {
        const error = new ApiError<{
          message?: string;
        }>({});
        if (r.status === 400 || r.status === 409) {
          const modelResponse: ApiDocsBadRequestResponse = await r.json();
          return error.set({
            message: modelResponse.message ?? '',
          });
        }
      },
    });
  }

  if (ApiError.isApiError(result)) {
    if (result.value()?.message !== undefined) {
      const message = 'Something went wrong on generating the logs';
      return message;
    }
  }
  toast('You have successfully generated the logs');

  return null;
};
const EXCLUDES_NODES = ['in-the-internet', 'out-the-internet'];

const ConsoleDiagnosticLogsTable = () => {
  const columnHelper = createColumnHelper<DiagnosisDiagnosticLogsLink>();
  const loaderData = useLoaderData() as LoaderDataType;
  const columns = useMemo(() => {
    const columns = [
      columnHelper.accessor('label', {
        cell: (cell) => cell.getValue(),
        header: () => 'Label',
        minSize: 75,
        size: 80,
        maxSize: 85,
      }),
      columnHelper.accessor('created_at', {
        cell: (cell) => {
          const createdAt = cell.getValue();
          if (createdAt) {
            return formatMilliseconds(createdAt);
          }
        },
        header: () => 'Created At',
        minSize: 75,
        size: 80,
        maxSize: 85,
      }),
      columnHelper.accessor('message', {
        cell: (cell) => cell.getValue(),
        header: () => 'Message',
        minSize: 75,
        size: 80,
        maxSize: 85,
      }),
      columnHelper.accessor('url_link', {
        cell: (cell) => {
          return (
            <DFLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const a = document.createElement('a');
                a.href = cell.row.original.url_link ?? '';
                a.click();
              }}
            >
              Click to download
            </DFLink>
          );
        },
        header: () => 'Downlload',
        minSize: 75,
        size: 80,
        maxSize: 85,
      }),
    ];
    return columns;
  }, []);

  return (
    <>
      <Suspense fallback={<TableSkeleton columns={4} rows={5} size={'sm'} />}>
        <DFAwait resolve={loaderData.data}>
          {(resolvedData: LoaderDataType) => {
            const { data, message } = resolvedData;
            const logs = data?.console_logs ?? [];

            return (
              <div>
                <h3 className="py-2 font-medium text-gray-900 dark:text-white uppercase text-sm tracking-wider">
                  Console Diagnostic Logs
                </h3>
                {message ? (
                  <p className="text-red-500 text-sm">{message}</p>
                ) : (
                  <Table
                    size="sm"
                    data={logs}
                    columns={columns}
                    enablePagination
                    pageSize={5}
                  />
                )}
              </div>
            );
          }}
        </DFAwait>
      </Suspense>
    </>
  );
};
const AgentDiagnosticLogsTable = () => {
  const columnHelper = createColumnHelper<DiagnosisDiagnosticLogsLink>();
  const loaderData = useLoaderData() as LoaderDataType;
  const columns = useMemo(() => {
    const columns = [
      columnHelper.accessor('label', {
        cell: (cell) => cell.getValue(),
        header: () => 'Label',
        minSize: 75,
        size: 80,
        maxSize: 85,
      }),
      columnHelper.accessor('created_at', {
        cell: (cell) => cell.getValue(),
        header: () => 'Created At',
        minSize: 75,
        size: 80,
        maxSize: 85,
      }),
      columnHelper.accessor('message', {
        cell: (cell) => cell.getValue(),
        header: () => 'Message',
        minSize: 75,
        size: 80,
        maxSize: 85,
      }),
      columnHelper.accessor('url_link', {
        cell: (cell) => {
          if (cell.row.original.message === '') {
            return 'No logs';
          }
          return <DFLink>Click to download</DFLink>;
        },
        header: () => 'Download',
        minSize: 75,
        size: 80,
        maxSize: 85,
      }),
    ];
    return columns;
  }, []);

  const revalidator = useRevalidator();

  useInterval(() => {
    revalidator.revalidate();
  }, 15000);

  return (
    <>
      <Suspense fallback={<TableSkeleton columns={4} rows={5} size={'sm'} />}>
        <DFAwait resolve={loaderData.data}>
          {(resolvedData: LoaderDataType) => {
            const { data, message } = resolvedData;
            const logs = data?.agent_logs ?? [];

            return (
              <div>
                <h3 className="py-2 font-medium text-gray-900 dark:text-white uppercase text-sm tracking-wider">
                  Agent Diagnostic Logs
                </h3>
                {message ? (
                  <p className="text-red-500 text-sm">{message}</p>
                ) : (
                  <Table
                    size="sm"
                    data={logs}
                    columns={columns}
                    enablePagination
                    pageSize={5}
                  />
                )}
              </div>
            );
          }}
        </DFAwait>
      </Suspense>
    </>
  );
};
const ConsoleDiagnosticLogsComponent = () => {
  return (
    <div className="bg-green-100 dark:bg-green-900/75 text-gray-500 dark:text-gray-300 px-4 py-6 w-fit rounded-lg flex flex-col max-w-[300px]">
      <h4 className="text-lg font-medium pb-2">Console Diagnostic Logs</h4>
      <span className="text-sm text-gray-500 dark:text-gray-300">
        Generate a link to download pdf for your console
      </span>
      <Form method="post">
        <input
          type="text"
          name="actionType"
          readOnly
          hidden
          value={ACTION_TYPE.CONSOLE_LOGS}
        />
        <Button size="xs" className="text-center mt-3 w-full" color="success">
          Get Logs
        </Button>
      </Form>
    </div>
  );
};

const AgentDiagnosticLogsComponent = () => {
  const [selectedHosts, setSelectedHosts] = useState([]);
  const [selectedClusters, setSelectedClusters] = useState([]);
  const { hosts, status: listHostStatus } = useGetHostsList({
    scanType: 'none',
  });

  const { clusters, status: listClusterStatus } = useGetClustersList();

  const loaderData = useLoaderData() as LoaderDataType;
  const actionData = useActionData() as string;

  return (
    <div className="bg-blue-100 dark:bg-blue-900/75 text-gray-600 dark:text-white px-4 py-6 w-fit rounded-lg flex flex-col max-w-[300px]">
      <h4 className="text-lg font-medium pb-2">Agent Diagnostic Logs</h4>
      <span className="text-sm text-gray-500 dark:text-gray-300">
        Generate a link to download pdf for your host/cluster agent
      </span>
      {listHostStatus !== 'idle' && listClusterStatus !== 'idle' ? (
        <div className="py-6">
          <CircleSpinner size="md" />
        </div>
      ) : (
        <Form method="post">
          {loaderData.message ? (
            <p className="text-sm text-red-500 pt-2">{loaderData.message}</p>
          ) : null}
          {actionData ? <p className="text-sm text-red-500 pt-2">{actionData}</p> : null}
          <input
            type="text"
            name="actionType"
            readOnly
            hidden
            value={ACTION_TYPE.AGENT_LOGS}
          />
          <Select
            value={selectedHosts}
            name="nodeIds[]"
            onChange={(value) => {
              setSelectedHosts(value);
            }}
            placeholder="Select host"
            sizing="xs"
            className="mt-2"
          >
            {hosts
              .filter((host) => {
                return !EXCLUDES_NODES.includes(host.nodeId);
              })
              .map((host) => {
                return (
                  <SelectItem value={host.nodeId} key={host.nodeId}>
                    {host.hostName}
                  </SelectItem>
                );
              })}
          </Select>
          <Select
            value={selectedClusters}
            name="clusterIds[]"
            onChange={(value) => {
              setSelectedClusters(value);
            }}
            placeholder="Select cluster"
            sizing="xs"
            className="mt-2"
          >
            {clusters
              .filter((cluster) => {
                return !EXCLUDES_NODES.includes(cluster.clusterId);
              })
              .map((cluster) => {
                return (
                  <SelectItem value={cluster.clusterId} key={cluster.clusterId}>
                    {cluster.clusterName}
                  </SelectItem>
                );
              })}
          </Select>
          <Button size="xs" className="text-center mt-3 w-full" color="primary">
            Get Logs
          </Button>
        </Form>
      )}
    </div>
  );
};
const DiagnosticLogs = () => {
  return (
    <SettingsTab value="diagnostic-logs">
      <div className="grid grid-cols-[310px_1fr] p-2 gap-x-2">
        <div className="flex flex-col mt-2 gap-y-3">
          <ConsoleDiagnosticLogsComponent />
          <AgentDiagnosticLogsComponent />
        </div>
        <div className="flex flex-col gap-y-10">
          <ConsoleDiagnosticLogsTable />
          <AgentDiagnosticLogsTable />
        </div>
      </div>
    </SettingsTab>
  );
};

export const module = {
  element: <DiagnosticLogs />,
  action,
  loader,
};