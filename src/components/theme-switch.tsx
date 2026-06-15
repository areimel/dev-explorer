import { COLOR_SCHEMES } from '@/config/color-schemes'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type Mode = 'light' | 'dark' | 'system'

export function ThemeSwitch() {
  const { theme, setTheme, resolvedTheme, colorScheme, setColorScheme } =
    useTheme()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='scale-95 rounded-full'>
          <Sun className='size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
          <Moon className='absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>Mode</DropdownMenuLabel>
        <div className='px-2 pb-1'>
          <ToggleGroup
            type='single'
            value={theme}
            onValueChange={(v) => v && setTheme(v as Mode)}
            variant='outline'
            className='w-full'
          >
            <ToggleGroupItem
              value='light'
              aria-label='Light'
              className='flex-1 gap-1.5'
            >
              <Sun className='size-3.5' />
              <span className='text-xs'>Light</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value='dark'
              aria-label='Dark'
              className='flex-1 gap-1.5'
            >
              <Moon className='size-3.5' />
              <span className='text-xs'>Dark</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value='system'
              aria-label='System'
              className='flex-1 gap-1.5'
            >
              <Monitor className='size-3.5' />
              <span className='text-xs'>System</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color scheme</DropdownMenuLabel>
        <ScrollArea className='h-64 pr-1'>
          {COLOR_SCHEMES.map((scheme) => (
            <DropdownMenuItem
              key={scheme.value}
              onSelect={(e) => {
                e.preventDefault()
                setColorScheme(scheme.value)
              }}
              className='gap-2'
            >
              <span
                className='size-3 shrink-0 rounded-full border'
                style={{ background: scheme.swatch[resolvedTheme] }}
              />
              {scheme.label}
              <Check
                className={cn(
                  'ms-auto size-3.5',
                  colorScheme !== scheme.value && 'hidden'
                )}
              />
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
