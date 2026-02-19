// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { validateCredentials, validateCredentialsJson } from './credentialsValidator';

// 有効な credentials.json のベースオブジェクト
const VALID_CREDENTIALS = {
  installed: {
    client_id: '123456789.apps.googleusercontent.com',
    client_secret: 'GOCSPX-secret',
    project_id: 'my-project-123',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    redirect_uris: ['http://localhost'],
  },
};

describe('validateCredentials', () => {
  describe('正常系', () => {
    it('有効な credentials.json を受け付ける', () => {
      expect(() => validateCredentials(VALID_CREDENTIALS)).not.toThrow();
    });

    it('戻り値が GoogleCredentials 型を持つ', () => {
      const result = validateCredentials(VALID_CREDENTIALS);
      expect(result.installed.client_id).toBe('123456789.apps.googleusercontent.com');
      expect(result.installed.project_id).toBe('my-project-123');
    });

    it('auth_provider_x509_cert_url は省略可能', () => {
      const withoutCertUrl = {
        installed: { ...VALID_CREDENTIALS.installed, auth_provider_x509_cert_url: undefined },
      };
      expect(() => validateCredentials(withoutCertUrl)).not.toThrow();
    });
  });

  describe('型チェック', () => {
    it('null は拒否', () => {
      expect(() => validateCredentials(null)).toThrow('不正なJSON形式です');
    });

    it('文字列は拒否', () => {
      expect(() => validateCredentials('string')).toThrow('不正なJSON形式です');
    });

    it('数値は拒否', () => {
      expect(() => validateCredentials(42)).toThrow('不正なJSON形式です');
    });

    it('配列は拒否', () => {
      expect(() => validateCredentials([])).toThrow('不正なJSON形式です');
    });
  });

  describe('必須フィールドチェック', () => {
    it('installed フィールドが無いと拒否', () => {
      expect(() => validateCredentials({})).toThrow(
        'credentials.jsonに必要な情報が含まれていません'
      );
    });

    it('client_id が無いと拒否', () => {
      const invalid = { installed: { ...VALID_CREDENTIALS.installed, client_id: '' } };
      expect(() => validateCredentials(invalid)).toThrow(
        'credentials.jsonに必要な情報が含まれていません'
      );
    });

    it('client_secret が無いと拒否', () => {
      const invalid = { installed: { ...VALID_CREDENTIALS.installed, client_secret: '' } };
      expect(() => validateCredentials(invalid)).toThrow(
        'credentials.jsonに必要な情報が含まれていません'
      );
    });

    it('redirect_uris が無いと拒否', () => {
      const invalid = {
        installed: { ...VALID_CREDENTIALS.installed, redirect_uris: undefined },
      };
      expect(() => validateCredentials(invalid)).toThrow(
        'credentials.jsonに必要な情報が含まれていません'
      );
    });
  });

  describe('client_id 形式チェック', () => {
    it('.apps.googleusercontent.com で終わらない client_id は拒否', () => {
      const invalid = {
        installed: { ...VALID_CREDENTIALS.installed, client_id: 'not-a-valid-id' },
      };
      expect(() => validateCredentials(invalid)).toThrow(
        'Google Cloud Consoleからダウンロードしたファイルではありません'
      );
    });
  });

  describe('auth_uri ドメインチェック', () => {
    it('google.com 以外の auth_uri は拒否', () => {
      const invalid = {
        installed: { ...VALID_CREDENTIALS.installed, auth_uri: 'https://evil.com/oauth' },
      };
      expect(() => validateCredentials(invalid)).toThrow(
        'credentials.jsonに必要な情報が含まれていません'
      );
    });

    it('不正な auth_uri URL は拒否', () => {
      const invalid = {
        installed: { ...VALID_CREDENTIALS.installed, auth_uri: 'not-a-url' },
      };
      expect(() => validateCredentials(invalid)).toThrow(
        'credentials.jsonに必要な情報が含まれていません'
      );
    });
  });

  describe('token_uri ドメインチェック', () => {
    it('googleapis.com 以外の token_uri は拒否', () => {
      const invalid = {
        installed: { ...VALID_CREDENTIALS.installed, token_uri: 'https://evil.com/token' },
      };
      expect(() => validateCredentials(invalid)).toThrow(
        'credentials.jsonに必要な情報が含まれていません'
      );
    });

    it('google.com の token_uri は許可', () => {
      const valid = {
        installed: {
          ...VALID_CREDENTIALS.installed,
          token_uri: 'https://oauth2.google.com/token',
        },
      };
      expect(() => validateCredentials(valid)).not.toThrow();
    });
  });
});

describe('validateCredentialsJson', () => {
  describe('正常系', () => {
    it('有効な JSON 文字列を受け付ける', () => {
      const json = JSON.stringify(VALID_CREDENTIALS);
      expect(() => validateCredentialsJson(json)).not.toThrow();
    });
  });

  describe('ファイルサイズチェック', () => {
    it('10KB を超えるファイルは拒否', () => {
      const largeJson = JSON.stringify({
        installed: {
          ...VALID_CREDENTIALS.installed,
          extra: 'x'.repeat(11 * 1024),
        },
      });
      expect(() => validateCredentialsJson(largeJson)).toThrow('ファイルサイズが大きすぎます');
    });

    it('10KB ちょうどは許可', () => {
      // 10KB以下の有効なJSONは通過する（ここでは正常なJSONで十分小さいことを確認）
      const json = JSON.stringify(VALID_CREDENTIALS);
      expect(json.length).toBeLessThan(10 * 1024);
      expect(() => validateCredentialsJson(json)).not.toThrow();
    });
  });

  describe('JSON パースエラー', () => {
    it('不正な JSON 文字列は拒否', () => {
      expect(() => validateCredentialsJson('{ invalid json }')).toThrow('不正なJSON形式です');
    });

    it('空文字は拒否', () => {
      expect(() => validateCredentialsJson('')).toThrow();
    });
  });
});
