import { vi } from 'vitest'
import type {
  ContributionCalendar,
  DetectedProject,
  GitHubProfile,
  GitStatus,
  ProjectCardMeta,
  ProjectDetails,
} from '../types'

export const tauriCommands = {
  scanRoot: vi.fn(async (_rootPath: string): Promise<DetectedProject[]> => []),
  readProjectDetails: vi.fn(
    async (_path: string): Promise<ProjectDetails> => ({
      path: _path,
      manifests: [],
      readmeMarkdown: null,
      lastModifiedMs: 0,
    })
  ),
  openWithLauncher: vi.fn(async (_p: string, _t: string) => {}),
  revealInExplorer: vi.fn(async (_p: string) => {}),
  getGitStatuses: vi.fn(
    async (_paths: string[]): Promise<Record<string, GitStatus>> => ({})
  ),
  getProjectCardsMeta: vi.fn(
    async (_paths: string[]): Promise<Record<string, ProjectCardMeta>> => ({})
  ),
  githubGetProfile: vi.fn(
    async (
      _username: string,
      _token: string | null
    ): Promise<GitHubProfile> => ({
      login: _username,
      name: null,
      avatarUrl: '',
      bio: null,
      publicRepos: 0,
      followers: 0,
      following: 0,
      htmlUrl: `https://github.com/${_username}`,
      location: null,
      company: null,
    })
  ),
  githubGetContributions: vi.fn(
    async (
      _username: string,
      _token: string
    ): Promise<ContributionCalendar> => ({
      totalContributions: 0,
      weeks: [],
    })
  ),
}
