import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class OpenaiService {

  private apiKey = environment.openaiApiKey;
  private apiUrl = 'https://api.openai.com/v1';

  constructor(private http: HttpClient) {}

  generateEmbedding(text: string) {
    const endpoint = `${this.apiUrl}/embeddings`;
    return this.http.post(endpoint, {
      input: text,
      model: 'text-embedding-ada-002',
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    });
  }

  async sendMessageToChatbot(message: string): Promise<any> {
    const endpoint = `${this.apiUrl}/chat/completions`;
    const body = {
      model: 'gpt-4', 
      messages: [{ role: 'user', content: message }],
    };

    return this.http.post(endpoint, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    }).toPromise();
  }

}
