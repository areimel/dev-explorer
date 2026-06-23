import {
  Database,
  FolderGit2,
  FolderTree,
  GitBranch,
  LayoutDashboard,
  Package,
  Palette,
  Rocket,
  Settings,
} from 'lucide-react'
import type { SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: { name: 'Dev Explorer', email: '', avatar: '' },
  teams: [{ name: 'Dev Explorer', logo: FolderGit2, plan: 'Local' }],
  navGroups: [
    {
      title: 'Workspace',
      items: [
        { title: 'Dashboard', url: '/', icon: LayoutDashboard },
        { title: 'Projects', url: '/projects', icon: FolderGit2 },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Scan Roots',
              url: '/settings/scan-roots',
              icon: FolderTree,
            },
            { title: 'Launchers', url: '/settings/launchers', icon: Rocket },
            { title: 'Templates', url: '/settings/templates', icon: Package },
            { title: 'GitHub', url: '/settings/github', icon: GitBranch },
            { title: 'Appearance', url: '/settings/appearance', icon: Palette },
            {
              title: 'Database Schema',
              url: '/settings/schema',
              icon: Database,
            },
          ],
        },
      ],
    },
  ],
}
