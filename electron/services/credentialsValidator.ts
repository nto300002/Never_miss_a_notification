/**
 * Google OAuth2 credentials.json のバリデーション (TASK-019-A)
 * アップロードされたファイルを厳格に検証してセキュアに保存する
 */

export interface GoogleCredentials {
  installed: {
    client_id: string;
    client_secret: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url?: string;
    redirect_uris: string[];
  };
}

const MAX_FILE_SIZE = 10 * 1024; // 10KB

const REQUIRED_FIELDS = [
  'client_id',
  'client_secret',
  'project_id',
  'auth_uri',
  'token_uri',
  'redirect_uris',
] as const;

/**
 * パース済みオブジェクトを検証する
 * @throws 検証失敗時に日本語エラーメッセージをスロー
 */
export function validateCredentials(data: unknown): GoogleCredentials {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('不正なJSON形式です');
  }

  const creds = data as Record<string, unknown>;

  if (!creds.installed || typeof creds.installed !== 'object') {
    throw new Error('credentials.jsonに必要な情報が含まれていません');
  }

  const installed = creds.installed as Record<string, unknown>;

  for (const field of REQUIRED_FIELDS) {
    if (!installed[field]) {
      throw new Error('credentials.jsonに必要な情報が含まれていません');
    }
  }

  // client_id 形式チェック
  if (
    typeof installed.client_id !== 'string' ||
    !installed.client_id.endsWith('.apps.googleusercontent.com')
  ) {
    throw new Error('Google Cloud Consoleからダウンロードしたファイルではありません');
  }

  // auth_uri ドメインチェック
  try {
    const authUri = new URL(installed.auth_uri as string);
    if (!authUri.hostname.endsWith('google.com')) {
      throw new Error('credentials.jsonに必要な情報が含まれていません');
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error('credentials.jsonに必要な情報が含まれていません');
    }
    throw e;
  }

  // token_uri ドメインチェック
  try {
    const tokenUri = new URL(installed.token_uri as string);
    if (
      !tokenUri.hostname.endsWith('googleapis.com') &&
      !tokenUri.hostname.endsWith('google.com')
    ) {
      throw new Error('credentials.jsonに必要な情報が含まれていません');
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error('credentials.jsonに必要な情報が含まれていません');
    }
    throw e;
  }

  return creds as unknown as GoogleCredentials;
}

/**
 * JSON 文字列を受け取り、パース + バリデーションを行う
 * @throws ファイルサイズ超過 / JSON不正 / 検証失敗 時にエラー
 */
export function validateCredentialsJson(jsonString: string): GoogleCredentials {
  if (jsonString.length > MAX_FILE_SIZE) {
    throw new Error('ファイルサイズが大きすぎます');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('不正なJSON形式です');
  }

  return validateCredentials(parsed);
}
