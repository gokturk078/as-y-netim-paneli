import { GITHUB_CONFIG } from './config.js';

export class GitHubAPI {
    constructor(config = GITHUB_CONFIG) {
        this.owner = config.owner;
        this.repo = config.repo;
        this.token = config.token;
        this.branch = config.branch;
        this.filePath = config.filePath;
        this.baseURL = 'https://api.github.com';
    }

    async getData() {
        if (!this.token) {
            console.warn('GitHub token is missing. Using local/mock data if available or failing.');
            // Fallback for demo purposes if token is missing
            // In a real scenario, this should strictly fail or prompt user
            throw new Error('GitHub Token Missing');
        }

        try {
            const response = await fetch(
                `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${this.filePath}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to fetch data');

            const data = await response.json();
            const content = JSON.parse(decodeURIComponent(escape(atob(data.content)))); // Robust base64 decode
            return { content, sha: data.sha };
        } catch (error) {
            console.error('GitHub API Error:', error);
            throw error;
        }
    }

    async updateData(newData, sha) {
        if (!this.token) throw new Error('GitHub Token Missing');

        try {
            // Encode with utf-8 support
            const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));

            const response = await fetch(
                `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${this.filePath}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Update payments data - ${new Date().toISOString()}`,
                        content: encodedContent,
                        sha: sha,
                        branch: this.branch
                    })
                }
            );

            if (!response.ok) throw new Error('Failed to update data');

            return await response.json();
        } catch (error) {
            console.error('GitHub API Error:', error);
            throw error;
        }
    }
}
