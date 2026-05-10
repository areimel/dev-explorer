import { useState } from 'react'

import * as Icons from 'lucide-react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const LAUNCHER_ICONS = [
  'Code',
  'Terminal',
  'Folder',
  'FolderOpen',
  'Rocket',
  'Globe',
  'Github',
  'GitBranch',
  'Database',
  'Server',
  'Box',
  'Wrench',
  'Hammer',
  'Zap',
  'Play',
  'FileText',
  'BookOpen',
  'Cpu',
] as const

type LauncherIconName = (typeof LAUNCHER_ICONS)[number]

type IconPickerProps = {
  value: string
  onChange: (name: string) => void
}

function LauncherIcon({ name }: { name: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const I = (Icons as any)[name] ?? Icons.Rocket
  return <I className='size-4' />
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = LAUNCHER_ICONS.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
        >
          <span className='flex items-center gap-2'>
            <LauncherIcon name={value} />
            {value}
          </span>
          <ChevronsUpDown className='ms-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-64 p-0'>
        <Command>
          <CommandInput
            placeholder='Search icons…'
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No icons found.</CommandEmpty>
            <CommandGroup>
              <div className='grid grid-cols-3 gap-1 p-1'>
                {filtered.map((name: LauncherIconName) => (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={() => {
                      onChange(name)
                      setOpen(false)
                      setSearch('')
                    }}
                    className='flex flex-col items-center gap-1 rounded p-2 text-xs'
                  >
                    <LauncherIcon name={name} />
                    <span className='truncate w-full text-center'>{name}</span>
                    {value === name && (
                      <Check className='absolute end-1 top-1 size-3' />
                    )}
                  </CommandItem>
                ))}
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
