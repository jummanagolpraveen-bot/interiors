'use client'

import { useLanguage, LANGUAGES } from '@/lib/contexts/LanguageContext'
import { Select } from '@/components/ui/Select'

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-500 uppercase font-semibold hidden md:block">Language:</label>
      <Select 
        value={language} 
        onChange={e => setLanguage(e.target.value)}
        className="h-8 text-sm w-[120px]"
      >
        {LANGUAGES.map(lang => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </Select>
    </div>
  )
}
