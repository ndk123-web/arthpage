export class GithubClient {
  constructor() {}

  async openIssueLink(title: string, description: string): Promise<void> {
    const urlTitle = encodeURIComponent(title);
    const urlDescription = encodeURIComponent(description);
    
    // Using the correct issue link format and labels
    const url = `https://github.com/ndk123-web/arthpage/issues/new?title=${urlTitle}&body=${urlDescription}&labels=bug,extension-issue`;

    // Chrome extension way to open new tab
    if (chrome && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: url });
    } else {
        window.open(url, "_blank");
    }
  }
}
