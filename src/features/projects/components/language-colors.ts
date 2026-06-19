// Deterministic color dot per language
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Rust: 'bg-orange-500',
  Python: 'bg-green-500',
  Go: 'bg-cyan-500',
  Ruby: 'bg-red-500',
  Java: 'bg-orange-400',
  'C#': 'bg-purple-500',
  'C++': 'bg-blue-400',
  C: 'bg-gray-500',
  Swift: 'bg-orange-400',
  Kotlin: 'bg-violet-500',
  PHP: 'bg-indigo-400',
  Dart: 'bg-cyan-400',
  Scala: 'bg-red-400',
  Elixir: 'bg-purple-400',
  Haskell: 'bg-violet-400',
  Lua: 'bg-blue-300',
  Shell: 'bg-green-400',
}

export function languageDotClass(language: string): string {
  return LANGUAGE_COLORS[language] ?? 'bg-muted-foreground'
}
