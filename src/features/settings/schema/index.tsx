import { useQuery } from '@tanstack/react-query'
import {
  Database,
  KeyRound,
  Link2,
  ListTree,
  MonitorOff,
} from 'lucide-react'

import { dbRepo } from '@/lib/tauri/db'
import type { TableSchema } from '@/lib/tauri/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { ContentSection } from '../components/content-section'

function ColumnBadges({ col }: { col: TableSchema['columns'][number] }) {
  return (
    <span className='flex flex-wrap gap-1'>
      {col.primaryKey && (
        <Badge variant='default' className='gap-1 text-xs'>
          <KeyRound className='size-3' />
          PK
        </Badge>
      )}
      {col.notNull && !col.primaryKey && (
        <Badge variant='secondary' className='text-xs'>
          NOT NULL
        </Badge>
      )}
      {!col.notNull && !col.primaryKey && (
        <Badge variant='outline' className='text-xs text-muted-foreground'>
          nullable
        </Badge>
      )}
      {col.defaultValue !== null && (
        <Badge variant='outline' className='font-mono text-xs'>
          default: {col.defaultValue}
        </Badge>
      )}
    </span>
  )
}

function TableCard({ table }: { table: TableSchema }) {
  return (
    <Card className='w-full'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Database className='size-4 text-muted-foreground' />
          {table.name}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Columns */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-1/4'>Column</TableHead>
              <TableHead className='w-1/4'>Type</TableHead>
              <TableHead>Constraints</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.columns.map((col) => (
              <TableRow key={col.name}>
                <TableCell className='font-mono text-sm'>{col.name}</TableCell>
                <TableCell className='font-mono text-sm text-muted-foreground'>
                  {col.type}
                </TableCell>
                <TableCell>
                  <ColumnBadges col={col} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Foreign keys */}
        {table.foreignKeys.length > 0 && (
          <div className='space-y-1'>
            <p className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
              <Link2 className='size-3.5' />
              Foreign Keys
            </p>
            <ul className='space-y-0.5'>
              {table.foreignKeys.map((fk) => (
                <li
                  key={`${fk.column}-${fk.refTable}-${fk.refColumn}`}
                  className='font-mono text-xs text-muted-foreground'
                >
                  {fk.column} → {fk.refTable}.{fk.refColumn}
                  {fk.onDelete !== 'NO ACTION' && (
                    <span className='ms-1 text-muted-foreground/60'>
                      ON DELETE {fk.onDelete}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Indexes */}
        {table.indexes.length > 0 && (
          <div className='space-y-1'>
            <p className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
              <ListTree className='size-3.5' />
              Indexes
            </p>
            <ul className='space-y-0.5'>
              {table.indexes.map((idx) => (
                <li
                  key={idx.name}
                  className='flex items-center gap-2 font-mono text-xs'
                >
                  <span className='text-muted-foreground'>{idx.name}</span>
                  <span className='text-muted-foreground/60'>
                    ({idx.columns.join(', ')})
                  </span>
                  {idx.unique && (
                    <Badge variant='outline' className='text-xs'>
                      UNIQUE
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function SettingsSchema() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['db-schema'],
    queryFn: () => dbRepo.getSchema(),
    retry: false,
  })

  return (
    <ContentSection
      title='Database Schema'
      desc='Live SQLite schema — tables, columns, constraints, foreign keys, and indexes.'
    >
      <div className='space-y-6'>
        {isLoading && (
          <div className='flex flex-col items-center gap-2 py-10 text-muted-foreground'>
            <Database className='size-8 animate-pulse opacity-40' />
            <p className='text-sm'>Loading schema…</p>
          </div>
        )}

        {isError && (
          <div className='flex flex-col items-center gap-3 py-10 text-muted-foreground'>
            <MonitorOff className='size-8 opacity-40' />
            <p className='text-sm font-medium'>
              Schema is available when running in the desktop app.
            </p>
            <p className='text-xs'>
              Launch Dev Explorer via{' '}
              <span className='font-mono'>pnpm tauri dev</span> to view the live
              schema.
            </p>
          </div>
        )}

        {data?.map((table) => (
          <TableCard key={table.name} table={table} />
        ))}
      </div>
    </ContentSection>
  )
}
