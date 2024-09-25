import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { Client as OpenSearchClient } from '@opensearch-project/opensearch';
import { OpensearchClient } from '../../src/utility/opensearchclient'; // Adjust import path as needed

jest.mock('@aws-sdk/client-sts');
jest.mock('@opensearch-project/opensearch');
jest.mock('@opensearch-project/opensearch/lib/aws/index', () => ({
  AwsSigv4Signer: jest.fn().mockReturnValue({}),
}));

describe('OpensearchClient', () => {
  const mockRoleArn = 'arn:aws:iam::123456789012:role/MyRole';
  const mockRegion = 'us-east-1';
  const mockOpenSearchUrl = 'https://my-opensearch-cluster.example.com';
  const mockCredentials = {
    AccessKeyId: 'mockAccessKeyId',
    SecretAccessKey: 'mockSecretAccessKey',
    SessionToken: 'mockSessionToken',
  };

  beforeAll(() => {
    process.env.ROLE_ARN = mockRoleArn;
    process.env.REGION = mockRegion;
    process.env.OPENSEARCH_URL = mockOpenSearchUrl;
  });

  afterAll(() => {
    delete process.env.ROLE_ARN;
    delete process.env.REGION;
    delete process.env.OPENSEARCH_URL;
  });
  
  beforeEach(() => {
    (STSClient as jest.Mock).mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({
        Credentials: mockCredentials,
      }),
    }));
  });

  describe('getClient', () => {
    it('should return an OpenSearch client with valid credentials', async () => {
      const opensearchClient = new OpensearchClient();
      const client = await opensearchClient.getClient();

      expect(STSClient).toHaveBeenCalledWith({ region: mockRegion });
      expect(AssumeRoleCommand).toHaveBeenCalledWith({
        RoleArn: mockRoleArn,
        RoleSessionName: 'githubWorkflowRunsMonitorSession',
      });
      expect(client).toBeInstanceOf(OpenSearchClient);
    });

    it('should throw an error if credentials are undefined', async () => {
      (STSClient as jest.Mock).mockImplementation(() => ({
        send: jest.fn().mockResolvedValue({
          Credentials: undefined,
        }),
      }));

      const opensearchClient = new OpensearchClient();

      await expect(opensearchClient.getClient()).rejects.toThrow(
        'Failed to assume role: credentials are undefined.'
      );
    });
  });

  describe('bulkIndex', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should throw an error if bulk indexing fails', async () => {
      const mockClient = {
        bulk: jest.fn().mockResolvedValue({
          body: {
            errors: true,
            items: [
              {
                index: { error: { type: 'some_error', reason: 'Some error occurred' } },
              },
            ],
          },
        }),
      };

      (OpenSearchClient as jest.Mock).mockImplementation(() => mockClient);

      const opensearchClient = new OpensearchClient();
      const documents = [{ id: 1, name: 'Document 1' }];
      const index = 'test-index';

      await expect(opensearchClient.bulkIndex(index, documents)).rejects.toThrow(
        'Bulk indexing errors: [{"type":"some_error","reason":"Some error occurred"}]'
      );
    });
  });
});
