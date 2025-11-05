import axios, { AxiosInstance } from 'axios';
import { Buffer } from 'buffer';
import { FileItem } from '../types';

class GitHubAPI {
  private client: AxiosInstance;
  private token: string = '';

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });
  }

  setToken(token: string) {
    this.token = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken() {
    this.token = '';
    delete this.client.defaults.headers.common['Authorization'];
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await this.client.get('/user');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async verifyRepository(owner: string, repo: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getRepositoryInfo(owner: string, repo: string) {
    const response = await this.client.get(`/repos/${owner}/${repo}`);
    return response.data;
  }

  async getContents(owner: string, repo: string, path: string = ''): Promise<FileItem[]> {
    const response = await this.client.get(`/repos/${owner}/${repo}/contents/${path}`);
    return Array.isArray(response.data) ? response.data : [response.data];
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<{ content: string; sha: string }> {
    const response = await this.client.get(`/repos/${owner}/${repo}/contents/${path}`);
    const data = response.data;

    if (data.type !== 'file') {
      throw new Error('Not a file');
    }

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return {
      content,
      sha: data.sha,
    };
  }

  async updateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    sha: string | null,
    message?: string
  ): Promise<{ sha: string }> {
    const base64Content = Buffer.from(content, 'utf-8').toString('base64');
    const commitMessage = message || `Update ${path} from mobile`;

    const body: any = {
      message: commitMessage,
      content: base64Content,
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await this.client.put(`/repos/${owner}/${repo}/contents/${path}`, body);
    return {
      sha: response.data.content.sha,
    };
  }

  async createFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message?: string
  ): Promise<{ sha: string }> {
    return this.updateFile(owner, repo, path, content, null, message || `Create ${path} from mobile`);
  }
}

export const githubApi = new GitHubAPI();
