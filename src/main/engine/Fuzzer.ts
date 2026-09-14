export class Fuzzer {
  private appUrl: string;

  constructor(appUrl: string = 'http://localhost:3000') {
    this.appUrl = appUrl.replace(/\/$/, '');
  }

  /**
   * Intentionally bombards the Ryvon backend with malformed data.
   * If the server crashes or throws a 400 Bad Request from Composio, it returns the HTTP Trace string.
   * If it successfully handles the error (e.g. 422 or a clean Ryvon response), it returns null.
   */
  async fuzzConnector(connectorSlug: string): Promise<string | null> {
    try {
      // Intentionally malicious payload: sending an object instead of a string to trigger the exact bug the user saw
      const maliciousPayload = {
        actionId: { nested_attack: 'expected_string_but_got_object' },
        params: { injected_null: null }
      };

      const targetUrl = `${this.appUrl}/api/connectors/${connectorSlug}/execute`;
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Passing a dummy auth header to simulate sandbox
          'Authorization': 'Bearer dima_sandbox_token'
        },
        body: JSON.stringify(maliciousPayload)
      });

      const responseText = await response.text();

      // If the Ryvon backend properly validates and rejects it gracefully, it should be a 422 or a cleanly handled JSON.
      // If it passes the malicious payload straight to Composio and gets a 400 Bad Request back, it's a vulnerability.
      // If it crashes Ryvon entirely (500), it's a vulnerability.
      
      if (response.status >= 500) {
        return `[FUZZER] Internal Server Error (500) when passing malformed data to ${targetUrl}.\nPayload: ${JSON.stringify(maliciousPayload)}\nResponse: ${responseText}`;
      }

      if (response.status === 400 && responseText.includes('Expected string, received object')) {
        return `[FUZZER] Composio API rejected the malformed payload. The Ryvon router failed to validate or sanitize the payload before sending it upstream.\nPayload: ${JSON.stringify(maliciousPayload)}\nResponse: ${responseText}\nFix required in lib/connectors/composio.ts or execute-connector.ts to strictly type-check parameters.`;
      }

      // Passed fuzzing (gracefully handled)
      return null;

    } catch (error: any) {
      return `[FUZZER] Network Error or Crash: ${error.message}`;
    }
  }
}
