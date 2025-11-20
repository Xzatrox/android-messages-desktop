import https from "https";

export interface ChatMessage {
  text: string;
  sender: string;
  space: string;
}

export class ChatApiService {
  private webhookUrl: string | null = null;

  setWebhookUrl(url: string) {
    this.webhookUrl = url;
  }

  async sendMessage(text: string): Promise<void> {
    if (!this.webhookUrl) return;

    const data = JSON.stringify({ text });
    const url = new URL(this.webhookUrl);

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname + url.search,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length,
          },
        },
        (res) => {
          res.on("end", () => resolve());
        }
      );

      req.on("error", reject);
      req.write(data);
      req.end();
    });
  }
}

export const chatApiService = new ChatApiService();
