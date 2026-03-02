interface SkillLoaderOptions {
  githubOwner?: string;
  githubRepo?: string;
  tempDir?: string;
}
interface Skill {
  name: string;
  path: string;
  description: string;
  version: string;
}
declare class SkillLoader {
  private githubOwner;
  private githubRepo;
  private tempDir;
  constructor(options?: SkillLoaderOptions);
  makeRequest(
    url: string,
    options?: {
      headers?: Record<string, string>;
    },
  ): Promise<any>;
  downloadFile(url: string): Promise<string>;
  downloadDirectory(url: string, destPath: string): Promise<void>;
  downloadSkillFromGitHub(skillName: string, version?: string, language?: string): Promise<string>;
  getLatestTag(): Promise<string>;
  loadSkills(version?: string, language?: string): Promise<Skill[]>;
  loadLocalSkills(language?: string): Promise<Skill[]>;
  listVersions(): Promise<string[]>;
}
export default SkillLoader;
