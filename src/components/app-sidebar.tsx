import {
  Home,
  Palette,
  Brain,
  Settings,
  SquareBottomDashedScissors,
  BookOpen,
} from 'lucide-react'
import { useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useLocation, Link } from 'react-router-dom'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'

import { DictaVersion } from './dicta-version'
import { DictaLogo } from './ui/dicta-logo'
import { SettingsDialog } from '../features/settings/components/settings-dialog'

const menuItems = [
  {
    title: 'Home',
    icon: Home,
    path: '/',
  },
  {
    title: 'Snippets',
    icon: SquareBottomDashedScissors,
    path: '/snippets',
  },
  {
    title: 'Vocabulary',
    icon: BookOpen,
    path: '/vocabulary',
  },
  {
    title: 'Vibes',
    icon: Palette,
    path: '/vibes',
  },
  {
    title: 'Models',
    icon: Brain,
    path: '/models',
  },
]

export function AppSidebar() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const location = useLocation()

  // Keyboard shortcut for settings: Cmd+,
  useHotkeys('mod+comma', () => setSettingsOpen(true), {
    preventDefault: true,
  })

  return (
    <>
      <Sidebar variant="sidebar" collapsible="offcanvas">
        <SidebarContent className="pt-12">
          <SidebarHeader>
            <div className="flex items-center gap-2.5 px-1">
              <DictaLogo size={22} className="text-primary" />
              <span className="text-base font-semibold tracking-tight text-foreground sour-gummy">
                Dicta
              </span>
            </div>
          </SidebarHeader>
          <SidebarSeparator className="my-1" />
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60 font-medium">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map(item => {
                  const isActive = location.pathname === item.path
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link
                          to={item.path}
                          className="flex items-center gap-2.5"
                        >
                          <item.icon className="h-4 w-4" strokeWidth={1.75} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="pb-4">
          <SidebarSeparator className="mb-1" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-2.5"
                tooltip="Settings (⌘,)"
              >
                <Settings className="h-4 w-4" strokeWidth={1.75} />
                <span>Settings</span>
                <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono">
                  ⌘,
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <DictaVersion />
        </SidebarFooter>
      </Sidebar>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
